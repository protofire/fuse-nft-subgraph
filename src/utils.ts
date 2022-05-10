import { Address, ipfs, json } from "@graphprotocol/graph-ts"
import { Account, Collectible } from "../generated/schema";

export const ADDRESS_ZERO = Address.fromString(
  "0x0000000000000000000000000000000000000000"
);

export let IPFS_SCHEME = "ipfs://";

export let HTTP_SCHEME = "https://";

export let DATA_SCHEME = "data:application/json;base64,";

export let BASE_IPFS_URL = "https://ipfs.io/ipfs/";

export let BASE_IPINATA_URL = 'https://gateway.pinata.cloud/ipfs/'

export let DWEB_IPFS_URL = "https://dweb.link/ipfs/";

export let COZY_ADDRESS = Address.fromString(
  "0x32319834d90323127988E4e2DC7b2162d4262904"
);

export function getURIScheme(input: string): string {
  return input.split(":")[0];
}

export function getIpfsPath(ipfsURI: string): string {
  return ipfsURI.split("ipfs://")[1];
}

export function getBase64(data: string): string {
    return data.split(",")[1];
  }

export function getIpfsURL(ipfsURI: string): string {
  return BASE_IPFS_URL + getIpfsPath(ipfsURI);
}

export function getOrCreateAccount(
  address: Address,
  persist: boolean = true
): Account {
  let accountAddress = address.toHexString();
  let account = Account.load(accountAddress);

   
  if (account == null) {
    account = new Account(accountAddress);
    account.address = address;

    if (persist) {
      account.save();
    }
  }

  return account as Account;
}

export function getDwebURL(ipfsURI: string): string {
  let ipfsURL = DWEB_IPFS_URL + getIpfsPath(ipfsURI);
  return ipfsURL;
}


export function readMetadata(
  collectible: Collectible,
  tokenURI: string
): Collectible {
  
  if(tokenURI != null || tokenURI != ""){

  
  let contentPath: string;
  if (tokenURI.startsWith(HTTP_SCHEME)) {
    contentPath = tokenURI.split(BASE_IPFS_URL).join('')
  } else if (tokenURI.startsWith(IPFS_SCHEME)) {
    contentPath = tokenURI.split(IPFS_SCHEME).join('')
  } else {
    return collectible
  }

  let data = ipfs.cat(contentPath)
  if (!data) return collectible;

  let jsonResult = json.try_fromBytes(data)
  if (jsonResult.isError) return collectible;

  let value = jsonResult.value.toObject()
  if (value != null) {
    let name = value.get('name')
    if (name != null) {
      collectible.name = name.toString()
    } else {
      return collectible;
    }

    let description = value.get('description')
    if (description != null) {
      collectible.description = description.toString()
    } else {
      return collectible;
    }

    let image = value.get('image')
    if (image != null) {
      let imageStr = image.toString()
      if (imageStr.includes(IPFS_SCHEME)) {
        imageStr = getIpfsURL(imageStr)
      }
      collectible.imageURL = imageStr
    } else {
      return collectible;
    }
  }
  collectible.save();
  return collectible;
}
return collectible;
}

