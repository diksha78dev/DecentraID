package com.decentraid.blockchain;

import com.decentraid.exception.BlockchainException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.web3j.abi.FunctionEncoder;
import org.web3j.abi.FunctionReturnDecoder;
import org.web3j.abi.TypeReference;
import org.web3j.abi.datatypes.Address;
import org.web3j.abi.datatypes.Bool;
import org.web3j.abi.datatypes.Function;
import org.web3j.abi.datatypes.Type;
import org.web3j.abi.datatypes.Utf8String;
import org.web3j.abi.datatypes.generated.Uint256;
import org.web3j.crypto.Credentials;
import org.web3j.crypto.Keys;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.core.DefaultBlockParameterName;
import org.web3j.protocol.core.methods.response.EthCall;
import org.web3j.protocol.core.methods.response.EthGetTransactionCount;
import org.web3j.protocol.core.methods.response.EthSendTransaction;
import org.web3j.protocol.core.methods.response.TransactionReceipt;
import org.web3j.tx.RawTransactionManager;
import org.web3j.tx.gas.DefaultGasProvider;

import java.math.BigInteger;
import java.util.Collections;
import java.util.List;

@Service
public class BlockchainService {

    private final Web3j web3j;
    private final Credentials ownerCredentials;

    @Value("${decentraid.blockchain.contract-address}")
    private String contractAddress;

    public BlockchainService(Web3j web3j, Credentials ownerCredentials) {
        this.web3j = web3j;
        this.ownerCredentials = ownerCredentials;
    }

    /**
     * Sends a state-changing transaction (write function) using the owner's credentials.
     * For the college demo, all writes (authorizeIssuer, issueCredential, revokeCredential)
     * are sent via the owner account, since Ganache accounts are all locally controlled anyway.
     */
    private String sendTransaction(Function function) {
        try {
            String encodedFunction = FunctionEncoder.encode(function);

            RawTransactionManager txManager = new RawTransactionManager(web3j, ownerCredentials);
            org.web3j.protocol.core.methods.response.EthSendTransaction response =
                    txManager.sendTransaction(
                            DefaultGasProvider.GAS_PRICE,
                            DefaultGasProvider.GAS_LIMIT,
                            Keys.toChecksumAddress(contractAddress),
                            encodedFunction,
                            BigInteger.ZERO
                    );

            if (response.hasError()) {
                throw new BlockchainException("Transaction failed: " + response.getError().getMessage());
            }

            String txHash = response.getTransactionHash();

            TransactionReceipt receipt = waitForReceipt(txHash);
            if (!receipt.isStatusOK()) {
                throw new BlockchainException("Transaction reverted on-chain: " + txHash);
            }

            return txHash;
        } catch (BlockchainException e) {
            throw e;
        } catch (Exception e) {
            throw new BlockchainException("Blockchain transaction error: " + e.getMessage(), e);
        }
    }

    private TransactionReceipt waitForReceipt(String txHash) throws Exception {
        int attempts = 0;
        while (attempts < 40) {
            var receiptResponse = web3j.ethGetTransactionReceipt(txHash).send();
            if (receiptResponse.getTransactionReceipt().isPresent()) {
                return receiptResponse.getTransactionReceipt().get();
            }
            Thread.sleep(500);
            attempts++;
        }
        throw new BlockchainException("Timed out waiting for transaction receipt: " + txHash);
    }

    @SuppressWarnings("unchecked")
    private List<Type> callFunction(Function function) {
        try {
            String encodedFunction = FunctionEncoder.encode(function);
            EthCall response = web3j.ethCall(
                    org.web3j.protocol.core.methods.request.Transaction.createEthCallTransaction(
                            Keys.toChecksumAddress(ownerCredentials.getAddress()),
                            Keys.toChecksumAddress(contractAddress),
                            encodedFunction),
                    DefaultBlockParameterName.LATEST
            ).send();

            if (response.hasError()) {
                throw new BlockchainException("Call failed: " + response.getError().getMessage());
            }

            return FunctionReturnDecoder.decode(response.getValue(), function.getOutputParameters());
        } catch (BlockchainException e) {
            throw e;
        } catch (Exception e) {
            throw new BlockchainException("Blockchain call error: " + e.getMessage(), e);
        }
    }

    // ---------------- Issuer Management ----------------

    public String authorizeIssuer(String issuerAddress) {
        Function function = new Function(
                "authorizeIssuer",
                Collections.singletonList(new Address(Keys.toChecksumAddress(issuerAddress))),
                Collections.emptyList()
        );
        return sendTransaction(function);
    }

    public String revokeIssuer(String issuerAddress) {
        Function function = new Function(
                "revokeIssuer",
                Collections.singletonList(new Address(Keys.toChecksumAddress(issuerAddress))),
                Collections.emptyList()
        );
        return sendTransaction(function);
    }

    public boolean isAuthorizedIssuer(String issuerAddress) {
        Function function = new Function(
                "isAuthorizedIssuer",
                Collections.singletonList(new Address(Keys.toChecksumAddress(issuerAddress))),
                Collections.singletonList(new TypeReference<Bool>() {})
        );
        List<Type> result = callFunction(function);
        return (Boolean) result.get(0).getValue();
    }

    // ---------------- Credential Issuance ----------------

    public String issueCredential(String credentialId, String credentialHash, String holderAddress, String credentialType) {
        Function function = new Function(
                "issueCredential",
                List.of(
                        new Utf8String(credentialId),
                        new Utf8String(credentialHash),
                        new Address(Keys.toChecksumAddress(holderAddress)),
                        new Utf8String(credentialType)
                ),
                Collections.emptyList()
        );
        return sendTransaction(function);
    }

    // ---------------- Revocation ----------------

    public String revokeCredential(String credentialId) {
        Function function = new Function(
                "revokeCredential",
                Collections.singletonList(new Utf8String(credentialId)),
                Collections.emptyList()
        );
        return sendTransaction(function);
    }

    // ---------------- Verification ----------------

    public CredentialChainData verifyCredential(String credentialId) {
        Function function = new Function(
                "verifyCredential",
                Collections.singletonList(new Utf8String(credentialId)),
                List.of(
                        new TypeReference<Bool>() {},
                        new TypeReference<Bool>() {},
                        new TypeReference<Address>() {},
                        new TypeReference<Address>() {},
                        new TypeReference<Utf8String>() {},
                        new TypeReference<Uint256>() {}
                )
        );
        List<Type> result = callFunction(function);

        return new CredentialChainData(
                (Boolean) result.get(0).getValue(),
                (Boolean) result.get(1).getValue(),
                (String) result.get(2).getValue(),
                (String) result.get(3).getValue(),
                (String) result.get(4).getValue(),
                (BigInteger) result.get(5).getValue()
        );
    }

    /** Simple DTO carrying the raw on-chain verification result. */
    public record CredentialChainData(
            boolean exists,
            boolean revoked,
            String issuer,
            String holder,
            String credentialType,
            BigInteger issuedAt
    ) {}
}