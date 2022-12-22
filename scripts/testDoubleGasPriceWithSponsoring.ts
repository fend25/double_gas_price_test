// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import {ethers} from 'hardhat'
import {ExtensionTools} from '@unique-nft/utils/extension'


import * as dotenv from 'dotenv'
import {ContractHelpersFactory} from "@unique-nft/solidity-interfaces";

import {
  Test__factory, Test
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
  console.log(`Gas used: ${parsed.gasUsed}, price: ~${parsed.price.toFixed(6)}, effectiveGasPrice: ${parsed.effectiveGasPrice}, price/gasUsed: ${parsed.rawPrice / parsed.gasUsed}`)
}


async function main() {
  //////////////////////////////////
  // prepare
  //////////////////////////////////

  dotenv.config()

  const wallet = await warmup()

  const PRIVATE_KEY_2 = process.env.PRIVATE_KEY_2 as string
  if (typeof PRIVATE_KEY_2 !== 'string') {
    throw new Error(`PRIVATE_KEY_2 should be string`)
  }
  const wallet2 = new ethers.Wallet(process.env.PRIVATE_KEY_2!, ethers.provider)

  console.log(`${wallet.address} - address of wallet 1`)
  console.log(`${wallet2.address} - address of wallet 2 (sponsor)`)

  const gasPrice = await wallet.provider.getGasPrice()
  console.log(`Today gas price is ${gasPrice}`)

  const Test = await ethers.getContractFactory("Test", wallet);
  const testDeployed = await Test.deploy();
  await testDeployed.deployed();
  console.log(`Deployed Test with address ${testDeployed.address}`)

  const test = Test__factory.connect(testDeployed.address, wallet)


  const contractHelpers = await ContractHelpersFactory(wallet)
  const contractHelpersFromWallet2 = await ContractHelpersFactory(wallet2)

  const toggleSponsoring = await (await contractHelpers.setSponsoringMode(
    test.address,
    1
  )).wait()
  console.log('\nToggle Sponsoring')
  console.dir(parseEthersTxReceipt(toggleSponsoring).events)
  logPriceAndGas(toggleSponsoring)

  const setSponsoringRateLimit = await (await contractHelpers.setSponsoringRateLimit(
    test.address,
    0
  )).wait()
  console.log('\nSet sponsoring rate limit')
  console.dir(parseEthersTxReceipt(setSponsoringRateLimit).events)
  logPriceAndGas(setSponsoringRateLimit)



  const setSponsorResult = await (await contractHelpers.setSponsor(
    test.address,
    wallet2.address
  )).wait()
  console.log('\nSponsor set')
  console.dir(parseEthersTxReceipt(setSponsorResult).events)
  logPriceAndGas(setSponsorResult)


  const confirmSponsorshipResult = await (await contractHelpersFromWallet2.confirmSponsorship(
    test.address,
  )).wait()
  console.log('\nSponsorship confirmed')
  console.dir(parseEthersTxReceipt(confirmSponsorshipResult).events)
  logPriceAndGas(confirmSponsorshipResult)

  const addToAllowList = await (await contractHelpers.toggleAllowed(
    test.address,
    wallet2.address,
    true
  )).wait()
  console.log('\nAdd to AllowList')
  console.dir(parseEthersTxReceipt(addToAllowList).events)
  logPriceAndGas(addToAllowList)

  let value = await test.getNumber()
  console.log(`Number value: ${value}`)

  console.log(`\n\nWallet 1 balance: ${ethers.utils.formatEther(await wallet.getBalance())}, Wallet 2 balance: ${ethers.utils.formatEther(await wallet2.getBalance())}\n`)

  const setNumber0 = await (await test.setNumber(
    1,
  )).wait()
  console.log('\nsetNumber0 - warmup - without gas price set explicitly')
  console.dir(parseEthersTxReceipt(setNumber0).events)
  logPriceAndGas(setNumber0)

  console.log(`\n\nWallet 1 balance: ${ethers.utils.formatEther(await wallet.getBalance())}, Wallet 2 balance: ${ethers.utils.formatEther(await wallet2.getBalance())}\n`)

  const setNumber1 = await (await test.setNumber(1, {gasPrice})).wait()
  console.log(`\nsetNumber1 - with gas price set explicitly (gas price: ${gasPrice})`)
  console.dir(parseEthersTxReceipt(setNumber1).events)
  logPriceAndGas(setNumber1)

  console.log(`\n\nWallet 1 balance: ${ethers.utils.formatEther(await wallet.getBalance())}, Wallet 2 balance: ${ethers.utils.formatEther(await wallet2.getBalance())}\n`)

  const setNumber2 = await (await test.setNumber(2)).wait()
  console.log(`\nsetNumber2 - without gas price set explicitly`)
  console.dir(parseEthersTxReceipt(setNumber2).events)
  logPriceAndGas(setNumber2)

  console.log(`\n\nWallet 1 balance: ${ethers.utils.formatEther(await wallet.getBalance())}, Wallet 2 balance: ${ethers.utils.formatEther(await wallet2.getBalance())}\n`)

  const setNumber3 = await (await test.setNumber(3, {gasPrice})).wait()
  console.log(`\nsetNumber3 - with gas price set explicitly (gas price: ${gasPrice})`)
  console.dir(parseEthersTxReceipt(setNumber3).events)
  logPriceAndGas(setNumber3)

  console.log(`\n\nWallet 1 balance: ${ethers.utils.formatEther(await wallet.getBalance())}, Wallet 2 balance: ${ethers.utils.formatEther(await wallet2.getBalance())}\n`)

  const setNumber4 = await (await test.setNumber(4)).wait()
  console.log(`\nsetNumber4 - without gas price was not set`)
  console.dir(parseEthersTxReceipt(setNumber4).events)
  logPriceAndGas(setNumber4)

  console.log(`\n\nWallet 1 balance: ${ethers.utils.formatEther(await wallet.getBalance())}, Wallet 2 balance: ${ethers.utils.formatEther(await wallet2.getBalance())}\n`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
