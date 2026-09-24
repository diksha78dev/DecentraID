# DecentraID — Deployed Contract & Demo Accounts

Contract address: 0x8c64aa8011cc42c5a2e5385e6536eb68fafa531e
Solidity version: 0.8.19
RPC: http://127.0.0.1:8545

- Owner (Admin):     0x85058e7848ca212b5dc88126f7481f4b9161abc4
- Issuer:            0xb511f8f01e90e2f34d7740323ebe4904afb1273d
- Holder:            0x794aa82aa19d4f8b7191c8922c90e8f3271fe421
- Random attacker:   0x54e7c99c4425be6c9054d04d8afb4a623c2e8128

The end-to-end backend flow passed against the active local Ganache network:
issuer authorization, credential issuance, verification, revocation, and
post-revocation verification.

Warning: keep Ganache running. Restarting it resets the local blockchain,
including this contract, authorization state, credentials, and account
balances. The contract must be redeployed and the backend signer must be
funded again after a Ganache restart.
