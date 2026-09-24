// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

/// @title DecentraID - Blockchain-Based Digital Identity Verification
/// @notice Stores only tamper-evident proof data. No PII is stored on-chain.
contract DecentraID {

    address public owner;

    struct Credential {
        string credentialId;
        string credentialHash;
        address holder;
        address issuer;
        string credentialType;
        uint256 issuedAt;
        bool exists;
        bool revoked;
    }

    mapping(address => bool) public authorizedIssuers;
    mapping(string => Credential) private credentials;

    event IssuerAuthorized(address indexed issuer);
    event IssuerRevoked(address indexed issuer);
    event CredentialIssued(string indexed credentialId, address indexed issuer, address indexed holder);
    event CredentialRevoked(string indexed credentialId, address indexed issuer);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }

    modifier onlyAuthorizedIssuer() {
        require(authorizedIssuers[msg.sender], "Caller is not an authorized issuer");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // ---------------- Issuer Management ----------------

    function authorizeIssuer(address issuer) external onlyOwner {
        require(issuer != address(0), "Invalid issuer address");
        authorizedIssuers[issuer] = true;
        emit IssuerAuthorized(issuer);
    }

    function revokeIssuer(address issuer) external onlyOwner {
        require(authorizedIssuers[issuer], "Issuer is not currently authorized");
        authorizedIssuers[issuer] = false;
        emit IssuerRevoked(issuer);
    }

    function isAuthorizedIssuer(address issuer) external view returns (bool) {
        return authorizedIssuers[issuer];
    }

    // ---------------- Credential Issuance ----------------

    function issueCredential(
        string calldata credentialId,
        string calldata credentialHash,
        address holder,
        string calldata credentialType
    ) external onlyAuthorizedIssuer {
        require(bytes(credentialId).length > 0, "Credential ID required");
        require(holder != address(0), "Invalid holder address");
        require(!credentials[credentialId].exists, "Credential ID already exists");

        credentials[credentialId] = Credential({
            credentialId: credentialId,
            credentialHash: credentialHash,
            holder: holder,
            issuer: msg.sender,
            credentialType: credentialType,
            issuedAt: block.timestamp,
            exists: true,
            revoked: false
        });

        emit CredentialIssued(credentialId, msg.sender, holder);
    }

    // ---------------- Credential Revocation ----------------

    function revokeCredential(string calldata credentialId) external {
        Credential storage cred = credentials[credentialId];
        require(cred.exists, "Credential does not exist");
        require(!cred.revoked, "Credential already revoked");
        require(
            msg.sender == cred.issuer || msg.sender == owner,
            "Only the issuing issuer or owner can revoke this credential"
        );

        cred.revoked = true;
        emit CredentialRevoked(credentialId, msg.sender);
    }

    // ---------------- Verification / Retrieval ----------------

    function verifyCredential(string calldata credentialId)
        external
        view
        returns (
            bool exists,
            bool revoked,
            address issuer,
            address holder,
            string memory credentialType,
            uint256 issuedAt
        )
    {
        Credential storage cred = credentials[credentialId];
        return (cred.exists, cred.revoked, cred.issuer, cred.holder, cred.credentialType, cred.issuedAt);
    }

    function getCredential(string calldata credentialId) external view returns (Credential memory) {
        require(credentials[credentialId].exists, "Credential does not exist");
        return credentials[credentialId];
    }
}
