import { log } from "@graphprotocol/graph-ts";
import { Erc721, Transfer } from "../generated/Erc721/Erc721";
import { Collection } from "../generated/schema";
import { ERC721 } from "../generated/templates";

export function handleTransfer(event: Transfer): void {
  let collectionAddress = event.address.toHex();
  let collection = Collection.load(collectionAddress);

  if (collection == null) {
    log.info("ADDING COLLECTION TEMPLATE {} for txHash {}", [
      event.address.toHexString(),
      event.transaction.hash.toHexString(),
    ]);
    collection = new Collection(event.address.toHex());
    collection.collectionAddress = event.address;
    collection.save();

    let erc721 = Erc721.bind(event.address);

    let name = erc721.try_name();
    if (!name.reverted) {
      collection.collectionName = name.value;
    }

    let symbol = erc721.try_symbol();
    if (!symbol.reverted) {
      collection.collectionSymbol = symbol.value;
    }
    collection.save();

    ERC721.create(event.address);
  }
}
