import { Transfer, YourCollectible } from '../generated/YourCollectible/YourCollectible'
import { Collectible, User } from '../generated/schema'

export function handleTransfer(event: Transfer): void {
  let collectible = Collectible.load(event.params.tokenId.toString())
  if (!collectible) {
    collectible = new Collectible(event.params.tokenId.toString())
  }

  let collectibleContract = YourCollectible.bind(event.address)
  collectible.collectibleURI = collectibleContract.tokenURI(event.params.tokenId)
  collectible.owner = event.params.to.toHexString()
  collectible.save()

  let user = User.load(event.params.to.toHexString())
  if (!user) {
    user = new User(event.params.to.toHexString())
    user.save()
  }
}
