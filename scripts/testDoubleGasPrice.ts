// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import {ethers} from 'hardhat'
import {ExtensionTools} from '@unique-nft/utils/extension'


import * as dotenv from 'dotenv'

import {
  CollectionHelpers__factory, UniqueNFT__factory
} from '../typechain-types'

import {ContractReceipt, Wallet} from 'ethers'
import {Address} from '@unique-nft/utils'

const parseEthersTxReceipt = ExtensionTools.Ethereum.parseEthersTxReceipt

const warmup = async (): Promise<Wallet> => {
  const PRIVATE_KEY = process.env.PRIVATE_KEY as string
  if (typeof PRIVATE_KEY !== 'string') {
    throw new Error(`PRIVATE_KEY should be string`)
  }

  console.log(await ethers.provider.getNetwork())
  console.log(`Head block number is: ${await ethers.provider.getBlockNumber()}`)

  const wallet = new ethers.Wallet(PRIVATE_KEY, ethers.provider)

  console.log(`address is ${wallet.address}`)
  console.log(`balance is ${ethers.utils.formatEther(await wallet.getBalance())}`)
  const gasPrice = await ethers.provider.getGasPrice()
  console.log(`gasPrice is ${gasPrice}`)

  return wallet
}

const logPriceAndGas = (receipt: ContractReceipt) => {
  const parsed = parseEthersTxReceipt(receipt)
  console.log(`Gas used: ${parsed.gasUsed}, price: ~${parsed.price.toFixed(6)}, effectiveGasPrice: ${parsed.effectiveGasPrice}, price/gasUsed: ${parsed.rawPrice/parsed.gasUsed}`)
}


async function main() {
  //////////////////////////////////
  // prepare
  //////////////////////////////////

  dotenv.config()

  const wallet = await warmup()

  const collectionHelpers = CollectionHelpers__factory.connect('0x6C4E9fE1AE37a41E93CEE429e8E1881aBdcbb54F', wallet)

  //////////////////////////////////
  // create collection
  //////////////////////////////////

  const txResult = await (await collectionHelpers.createNFTCollection(
    'name',
    'descr',
    'PRFX',
    {
      value: (await collectionHelpers.collectionCreationFee())
    }
  )).wait()
  const parsedTxResult = parseEthersTxReceipt(txResult)

  // console.dir(parsedTxResult, {depth: 100})

  const collectionAddress = parsedTxResult.events.CollectionCreated.collectionId
  const collectionId = Address.collection.addressToId(collectionAddress)

  console.log(`Created collection ${collectionId}: ${collectionAddress}`)
  logPriceAndGas(txResult)

  const collection = await UniqueNFT__factory.connect(collectionAddress, wallet)

  ////////////////////////////////////////////////////////////////////
  // mint two tokens - without and with gas price being explicitly set
  ////////////////////////////////////////////////////////////////////

  const mintResult1 = await (await collection.mint(
    wallet.address
  )).wait()

  console.log('\nMint result 1 (without explicit gas price):')
  logPriceAndGas(mintResult1)

  const mintResult2 = await (await collection.mint(
    wallet.address,
    {
      gasPrice: await wallet.provider.getGasPrice()
    }
  )).wait()

  console.log('\nMint result 2 (with explicit gas price):')
  logPriceAndGas(mintResult2)

  ///////////////////////////////////////////////////////////////////////
  // make two transfers - without and with gas price being explicitly set
  ///////////////////////////////////////////////////////////////////////

  const transferResult1 = await (await collection.transfer(
    '0x0000000000000000000000000000000000000001',
    1
  )).wait()

  console.log('\nTransfer result 1 (without explicit gas price):')
  logPriceAndGas(transferResult1)

  const transferResult2 = await (await collection.transfer(
    '0x0000000000000000000000000000000000000001',
    2,
    {
      gasPrice: await wallet.provider.getGasPrice()
    }
  )).wait()

  console.log('\nTransfer result 2 (with explicit gas price):')
  logPriceAndGas(transferResult2)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
