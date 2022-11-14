
import { BigNumber } from "ethers";
import {ethers} from "hardhat";
import { MyToken__factory, TokenizedBallot__factory } from "../typechain-types";


const MINT_VALUE = ethers.utils.parseEther("10");
function convertStringArrayToBytes32(array: string[]) {
    const bytes32Array = [];
    for (let index = 0; index < array.length; index++) {
      bytes32Array.push(ethers.utils.formatBytes32String(array[index]));
    }
    return bytes32Array;
  }



async function main() {
    const proposals = process.argv.slice(2);
    proposals.forEach((element, index) => {
        console.log(`Proposal N. ${index + 1}: ${element}`);
      });
    const accounts = await ethers.getSigners();

    //deploy contract
    const contractFactory = new MyToken__factory(accounts[0]);
    const contract = await contractFactory.deploy();
    await contract.deployed();
    console.log(`Token contract deployed at ${contract.address}\n`);


    //Minting Tokens
    const mintTx = await contract.mint(accounts[1].address, MINT_VALUE);
    await mintTx.wait();
    console.log(`${accounts[0].address} Minted ${MINT_VALUE.toString()} decimal units to ${accounts[1].address}\n`);
    const balanceBN = await contract.balanceOf(accounts[1].address);
    console.log(`${accounts[1].address} has ${balanceBN.toString()} decimal units of MyToken\n`);


    //check voting power
    const votes = await contract.getVotes(accounts[1].address);
    console.log(`${accounts[1].address} has ${votes.toString()} numbers of Votes before self delegating\n`);

    //self delegating
    const delegateTx = await contract.connect(accounts[1]).delegate(accounts[1].address);
    await delegateTx.wait();

    //Voting power after delegation
    const votesAfter = await contract.getVotes(accounts[1].address);
    console.log(`${accounts[1].address} has ${votesAfter.toString()} numbers of Votes after self delegating\n`);

    // //Transfer Tokens
    // const transferTx = await contract.connect(accounts[1]).transfer(accounts[2].address, MINT_VALUE.div(2));
    // await transferTx.wait();
    
    //Voting power after transfer
    // const votes1AfterTransfer = await contract.getVotes(accounts[1].address);
    // console.log(`${accounts[1].address} has ${votes1AfterTransfer.toString()} numbers of Votes after transfer\n`);

    // const votes2AfterTransfer = await contract.getVotes(accounts[2].address);
    // console.log(`${accounts[2].address} has ${votes2AfterTransfer.toString()} numbers of Votes after transfer\n`);

    // //check past voting power
    // const lastBlock = await ethers.provider.getBlock("latest");
    // console.log(`Current block number is ${lastBlock.number}\n`)
    // const pastVotes = await contract.getPastVotes(accounts[1].address, lastBlock.number - 1);
    // console.log(`Account ${accounts[1].address} had ${pastVotes.toString()} units of voting power in the last block \n`);

    //Tokenized Ballot deploying
    const lastBlock = await ethers.provider.getBlock("latest");
    const  ballotFactory = new TokenizedBallot__factory(accounts[0]);
    const ballot = await ballotFactory.deploy(convertStringArrayToBytes32(proposals), contract.address, lastBlock.number - 1);
    await ballot.deployed();
    console.log(`Tokenized Ballot deployed ${ballot.address}\nat target block number ${lastBlock.number - 1}\n`);

    
    const votesAfterTokenBallot = await contract.getVotes(accounts[1].address);
    console.log(`${accounts[1].address} has ${votesAfterTokenBallot.toString()} numbers of Votes after token ballot\n`);


    //Checking Voting Power
    const votingPower = await ballot.votingPower(accounts[0].address);
    console.log(`Account 1 has ${votingPower} Voting power\n`);


    //Casting Votes
    // // const amount = ethers.utils.parseEther("10");
    // const castingVoteTx = await ballot.connect(accounts[1]).vote(proposals[3], 10);
    // await castingVoteTx.wait();
    // console.log(`${accounts[1].address} voted for ${proposals[3]}\n`)


}


main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});