export let IPFS_SCHEME = 'ipfs://'

export let HTTP_SCHEME = 'https://'

export let BASE_IPFS_URL = 'https://ipfs.io/ipfs/'

export function getURIScheme (input: string): string {
    return input.split(':')[0]
}

export function getIpfsPath (ipfsURI: string): string {
    return ipfsURI.split('ipfs://')[1]
}

export function getIpfsURL (ipfsURI: string): string {
    return BASE_IPFS_URL + getIpfsPath(ipfsURI)
}

