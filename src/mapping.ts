import {
  Address,
  ethereum,
  log,
  store
} from "@graphprotocol/graph-ts";
import { Transfer, Erc721 } from "../generated/Erc721/Erc721";
import { Collection, Collectible, IndexedBlock, CollectiblesOfIndexedBlock } from "../generated/schema";
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

      let id = event.block.number.toString();
      let block = new IndexedBlock(id);
      block.save();

      let collectiblesOfIndexedBlock = new CollectiblesOfIndexedBlock(tokenId)
      collectiblesOfIndexedBlock.block = block.id;
      collectiblesOfIndexedBlock.save();

      item.creator = account.id;
      item.owner = item.creator;
      item.revealed = false;
      item.tokenId = event.params.tokenId;
      item.collection = collection.id;
    
      item.descriptorUri = ''
      item.created = event.block.timestamp;
      item.save();

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
          item.owner = ADDRESS_ZERO.toHexString();

          log.info("BURN - tokenid: {}, txHash: {}", [
            tokenId,
            event.transaction.hash.toHexString(),
          ]);
        } else {
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


export function handleBlock(block: ethereum.Block): void {
  let blockId = block.number.toString();
  let indexedBlock = IndexedBlock.load(blockId);
  if (indexedBlock == null) {
    return;
  }

  let collectibles = indexedBlock.collectibles.load();

  for (let i = 0; i < collectibles.length; i++) {
    let collectiblesOfIndexedBlock = collectibles[i];

    let collectible = Collectible.load(collectiblesOfIndexedBlock.id);

    if (collectible !== null) {
      let collectibleOwner = Address.fromString(collectible.owner);

      if (collectibleOwner.toHexString() != ADDRESS_ZERO.toHexString()) {
        let tokenURIResult = Erc721.bind(
          Address.fromString(collectible.collection),
        ).try_tokenURI(collectible.tokenId);

        if (tokenURIResult.reverted) {
          log.warning("getTokenURI reverted", []);
          return;
        }

        if (
          Address.fromString(collectible.collection).toHexString() ==
            COZY_ADDRESS.toHexString() &&
          collectible.revealed == false &&
          tokenURIResult.value != collectible.descriptorUri
        ) {
          collectible.revealed = true;
          collectible.descriptorUri = tokenURIResult.value;
          collectible.save();

          readMetadata(collectible, tokenURIResult.value);

          log.info("Updated Metadata - CollectibleId: {}", [collectible.id]);
        } else {
          collectible.descriptorUri = tokenURIResult.value;
          collectible.save();

          readMetadata(collectible, collectible.descriptorUri);
        }
      }
    }
    store.remove("CollectiblesOfIndexedBlock", collectiblesOfIndexedBlock.id);
  }
  // store.remove("Block", blockId);
}