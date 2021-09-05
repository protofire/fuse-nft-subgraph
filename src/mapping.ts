import { ipfs, json } from '@graphprotocol/graph-ts'
import { Transfer, YourCollectible } from '../generated/YourCollectible/YourCollectible'
import { Collectible, User } from '../generated/schema'

export function handleTransfer(event: Transfer): void {
  let collectible = Collectible.load(event.params.tokenId.toString())
  if (!collectible) {
    collectible = new Collectible(event.params.tokenId.toString())
  }

  let collectibleContract = YourCollectible.bind(event.address)
  let baseURI = collectibleContract.baseURI()
  let tokenURI = collectibleContract.tokenURI(event.params.tokenId)
  let hash = tokenURI.split(baseURI)[1]

  if (hash) {
    let data = ipfs.cat(hash)
    if (!data) return

    let value = json.fromBytes(data!).toObject()

    if (data != null) {
      collectible.name = value.get('name').toString()
      collectible.description = value.get('description').toString()
      collectible.imageURL = value.get('image').toString()
    }
  }

  collectible.collectibleURI = tokenURI
  collectible.owner = event.params.to.toHexString()
  collectible.save()

  let user = User.load(event.params.to.toHexString())
  if (!user) {
    user = new User(event.params.to.toHexString())
    user.save()
  }
}
