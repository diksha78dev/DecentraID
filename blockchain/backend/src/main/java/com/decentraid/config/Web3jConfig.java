package com.decentraid.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.web3j.crypto.Credentials;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.http.HttpService;

@Configuration
public class Web3jConfig {

    @Value("${decentraid.blockchain.rpc-url}")
    private String rpcUrl;

    @Value("${decentraid.blockchain.owner-private-key}")
    private String ownerPrivateKey;

    @Bean
    public Web3j web3j() {
        return Web3j.build(new HttpService(rpcUrl));
    }

    @Bean
    public Credentials ownerCredentials() {
        return Credentials.create(ownerPrivateKey);
    }
}