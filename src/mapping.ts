import { ipfs, json, log } from '@graphprotocol/graph-ts'
import { Transfer, Erc721 } from '../generated/Collectible/Erc721'
import { Collectible, User } from '../generated/schema'
import { BASE_IPFS_URL, getIpfsURL, HTTP_SCHEME, IPFS_SCHEME } from './utils'

export function handleTransfer(event: Transfer): void {
  log.info('Parsing Transfer for txHash {}', [event.transaction.hash.toHexString()])

  let collectible = Collectible.load(event.params.tokenId.toString())
  if (!collectible) {
    collectible = new Collectible(event.params.tokenId.toString())
  }

  let erc721Token = Erc721.bind(event.address)
  let tokenURIResult = erc721Token.try_tokenURI(event.params.tokenId)
  if (tokenURIResult.reverted) {
    return
  }
  
  let tokenURI = tokenURIResult.value
  
  let contentPath: string
  if (tokenURI.includes(HTTP_SCHEME)) {
    contentPath = tokenURI.split(BASE_IPFS_URL).join('')
  } else if (tokenURI.includes(IPFS_SCHEME)) {
    contentPath = tokenURI.split(IPFS_SCHEME).join('')
  } else {
    return
  }

  let data = ipfs.cat(contentPath)
  if (!data) return

  let value = json.fromBytes(data!).toObject()

  if (data != null) {
    collectible.name = value.get('name').toString()
    collectible.description = value.get('description').toString()

    let image = value.get('image').toString()
    if (image.includes(IPFS_SCHEME)) {
      image = getIpfsURL(image)
    }
    collectible.imageURL = image
  }

  let name = erc721Token.try_name()
  if (!name.reverted) {
    collectible.collectionName = name.value
  }

  let symbol = erc721Token.try_symbol()
  if (!symbol.reverted) {
    collectible.collectionSymbol = symbol.value
  }

  collectible.owner = event.params.to.toHexString()
  collectible.save()

  let user = User.load(event.params.to.toHexString())
  if (!user) {
    user = new User(event.params.to.toHexString())
    user.save()
  }
}
