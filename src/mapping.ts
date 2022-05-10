import {
  log
} from "@graphprotocol/graph-ts";
import { Transfer, Erc721 } from "../generated/Erc721/Erc721";
import { Collection,  Collectible } from "../generated/schema";
import {
  ADDRESS_ZERO,
  COZY_ADDRESS,
  getOrCreateAccount,
  readMetadata
} from "./utils";

export function handleTransfer(event: Transfer): void {
  log.info("Parsing Transfer for txHash {}", [
    event.transaction.hash.toHexString(),
  ]);

  let collection = Collection.load(event.address.toHex());
  if (collection != null) {
    let account = getOrCreateAccount(event.params.to);
   
    let tokenId = event.address.toHexString() + "-" + event.params.tokenId.toHexString();

    if (event.params.from.toHexString() == ADDRESS_ZERO.toHexString()) {
      // Mint token
      let item = new Collectible(tokenId);

      item.creator = account.id;
      item.owner = item.creator;
      item.tokenId = event.params.tokenId;
      item.collection = collection.id;
      item.descriptorUri = Erc721.bind(event.address).tokenURI(
        event.params.tokenId
      );
      item.created = event.block.timestamp;
      item.save();
      item = readMetadata(item, item.descriptorUri);
      log.info("MINT  - tokenid: {}, txHash: {}", [
        tokenId,
        event.transaction.hash.toHexString(),
      ]);
    } else {
      let item = Collectible.load(tokenId);

      if (item != null) {
        if (event.params.to.toHexString() == ADDRESS_ZERO.toHexString()) {
          // Burn token
          item.removed = event.block.timestamp;
          log.info("BURN - tokenid: {}, txHash: {}", [
            tokenId,
            event.transaction.hash.toHexString(),
          ]);
        } else {
          
          if(event.address.toHexString() == COZY_ADDRESS.toHexString() && item.revealed == null)
          {
            var descriptor = Erc721.bind(event.address).tokenURI(
              event.params.tokenId
            );
            if(descriptor != item.descriptorUri) {
              item.descriptorUri = descriptor;
              item.revealed = true;
              readMetadata(item, item.descriptorUri).save();
              log.info("Updated Metadata - tokenid: {}, txHash: {}", [
                tokenId,
                event.transaction.hash.toHexString(),
              ]);
            
            }
          }
         
          
          // Transfer token
          item.owner = account.id;
          item.modified = event.block.timestamp;

          log.info("TRANSFER - tokenid: {}, txHash: {}", [
            tokenId,
            event.transaction.hash.toHexString(),
          ]);
        }

        item.save();
      } else {
        log.warning("Collectible #{} not exists", [tokenId]);
      }
    }
  }
}
