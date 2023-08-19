import * as React from 'react'
import ABI from './ABI.json'
import NFTABI from './ERC721ABI.json'
import Logo from './Rival-Bears-Logo.png'
import LostTribes from './LostTribesLogo.jpeg'
import MadHoneyLogo from './MadHoneyLogo.png'
import LogoText from './LogoText.webp'
import { Squash as Hamburger } from 'hamburger-react'
import {Navbar} from 'react-bootstrap'
import { Web3Modal,Web3Button } from '@web3modal/react'
import './App.css';
import { readContracts,readContract,prepareWriteContract,writeContract } from '@wagmi/core'
import { EthereumClient, w3mConnectors, w3mProvider } from '@web3modal/ethereum'
import { polygon } from 'wagmi/chains'
import { configureChains, createConfig, useAccount} from 'wagmi'
import { useState } from 'react';
import axios from 'axios'
import Multipliers from './Multipliers.json'

const contractAddress = '0x1a21Dfd8811F9bCf993c843472a69A9a527a8316';
const madHoney = '0x86c18085b8949ff3dc53ec5c3a3a143ccfbc960a';
const rivalBears = '0xa25541164ae9d59322b59fe94a73869b494c3691';
var rivalBearsURL;
var madHoneyURL;
var wallet;
const chains = [polygon];
const projectId = '2f9b552c9acbb2c405cbbe66e21593fb';

const { publicClient } = configureChains(chains, [w3mProvider({ projectId })]);

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: w3mConnectors({ projectId, chains }),
  publicClient
});

const ethereumClient = new EthereumClient(wagmiConfig, chains);
const selectedStakes = [];
const selectedNFTs = [];
var isConnected=false;

function App() {
  async function setMetadataURL(){
    await readContracts({
      contracts: [
        {
          address: rivalBears,
          abi: NFTABI,
          functionName: 'tokenURI',
          args: [0],
        },
        {
          address: madHoney,
          abi: NFTABI,
          functionName: 'tokenURI',
          args: [0],
        }
      ],
    }).then((data)=>{
      //ipfs://bafybeifziei2rtbqqitk2pwcknw2qadruzbtrvsca6dilhsf6ewqvfueui/0.json
      //https://bafybeifmy7mqifmbdq3bwnxehhpm625as3onsyzm6lmdaroc2r5nkyhwmy.ipfs.nftstorage.link/0.json
      rivalBearsURL = "https" + data[0].result.slice(4,-7) + ".ipfs.nftstorage.link/";
      madHoneyURL = "https" + data[1].result.slice(4,-7) + ".ipfs.nftstorage.link/";
      //console.log(madHoneyURL);
    }).catch(()=>{})
  }
  const account = useAccount({
    onConnect({address}) {
      loadDashboard();
      isConnected=true;
      wallet=address;
      if(rivalBearsURL==undefined){
        setMetadataURL();
      }
    },
    onDisconnect() {
      isConnected=false;
      hideContent();
      wallet=null;
      setMyStakes={};
    },
  });

  var expanded = false;
  var moving = false;

  async function expandSidebar(){
    if(moving===true || expanded===true){
      return;
    }
    moving = true;
    expanded = true;
    let sidebar = document.getElementsByClassName("Sidebar")[0];
    sidebar.classList.toggle("expanded");
    moving = false;
  }

  async function collapseSidebar(){
    if(moving===true || expanded===false){
      return;
    }
    moving = true;
    expanded = false;
    let sidebar = document.getElementsByClassName("Sidebar")[0];
    sidebar.classList.remove("expanded");
    moving = false;
  }

  const [totalStakes,setTotalStakes] = useState("...");
  const [totalHarvested,setTotalHarvested] = useState("...");
  const [myStakedAmount,setMyStakedAmount] = useState("...");
  const [myEarnings,setMyEarnings] = useState("...");
  const [myBalance,setMyBalance] = useState("...");
  const [myStakes,setMyStakes] = useState(<h2>No Stakes Found...</h2>);
  
  async function loadDashboard(){
    selectedStakes.length=0;
    await readContracts({
      contracts: [
        {
          address: contractAddress,
          abi: ABI,
          functionName: 'getTotalStaked',
        },
        {
          address: contractAddress,
          abi: ABI,
          functionName: 'getAccumulatedHarvestedPoints',
        }
      ],
    }).then((data)=>{
      setTotalStakes(data[0].result.toLocaleString())
      setTotalHarvested(data[1].result.toLocaleString())
    }).catch(()=>{})
    
    await new Promise(resolve => setTimeout(resolve, 100));

    await readContracts({
      contracts: [
        {
          address: contractAddress,
          abi: ABI,
          functionName: 'getStakerUnharvestedPoints',
          args:[wallet],
        },
        {
          address: contractAddress,
          abi: ABI,
          functionName: 'getStakerAccumulatedHarvestedPoints',
          args:[wallet],
        }
      ],
    }).then((data)=>{
      setMyEarnings(data[0].result.toLocaleString())
      setMyBalance(data[1].result.toLocaleString())
    }).catch(()=>{})

    const data = await readContract({
      address: contractAddress,
      abi: ABI,
      functionName: 'getStakes',
      args: [wallet],
    }).catch({});
    if(data.result == undefined){
      setMyStakedAmount(0);
      setMyStakes(<h2>No Stakes Found...</h2>);
      return;
    }
    const length = data.result.length;
    setMyStakedAmount(length);
    if(myStakedAmount==0){
    }
    const stakes = [];
    for (let i = 0; i < data.result.length; i++) {
      stakes.push(
        await getStakingCard(
          i,
          data[i].nft,
          data[i].tokenId
        )
      );
    }
    setMyStakes(stakes);
    /*const testStakes = [];
    const url = "https://img-cdn.magiceden.dev/rs:fit:640:640:0:0/plain/https%3A%2F%2Fbafybeidjrtq3oxpvpxdivrxonsk7jiubik7hmln7hmiuxa5szbfqddygui.ipfs.nftstorage.link%2F3609.jpg%3Fext%3Djpg";
    const multiplier = 0;
    const tokenId = 1;
    const nft = "0x0...0";
    for (let i = 0; i < 10; i++){
      testStakes.push(
        getStakingCard(
          i,
          nft,
          tokenId,
          multiplier,
          url
        )
      );
    }
    setMyStakes(testStakes);*/
  }

  async function getStakingCard(stakingIndex,nft,tokenId){
    let colorClass;
    let url;
    let metadata;
    let multiplier=100;
    if(nft!=madHoney){
      metadata = rivalBearsURL + tokenId + ".json";
    }
    else{
      colorClass="MadHoney";
      metadata = madHoneyURL + tokenId + ".json";
    }
    axios.get(metadata).then(response => {
        url = response.data.image;
        if(nft!=madHoney){
          let attribute, value;
          for(let i=0;i<response.data.attributes.length;i++){
            attribute = response.data.attributes[i].trait_type;
            value = response.data.attributes[i].value;
            if(attribute in Multipliers && value in Multipliers[attribute]){
              multiplier+=Multipliers[attribute][value];
            }
          }
        }
      }).catch(error => {});
    
    return <div className={`StakingCard${colorClass}`} key={stakingIndex}>
      <div>#{tokenId}</div>
      <div>x&nbsp;{multiplier}%</div>
      <img src={url} onClick={(event)=>{toggleStakeSelection(stakingIndex,event.target)}}/>
    </div>;
  }
  
  let selectionIndex;
  const [unstakeButtonText,setUnstakeButtonText] = useState("Unstake");

  function toggleInventorySelection(asset,element){
    //asset.contract_address > string
    //asset.token_id > string
    const NFT = {
      address:asset.contract_address,
      tokenId:asset.token_id,
    }
    selectionIndex = selectedNFTs.findIndex((arrayObject)=>{
      return (arrayObject.address == NFT.address && arrayObject.tokenId == NFT.tokenId);
    });
    if(selectionIndex>-1){
      element.classList.remove("Selected");
      selectedNFTs.splice(selectionIndex, 1);
      return;
    }
    element.classList.add("Selected");
    selectedNFTs.push(NFT);
  }

  async function toggleStakeSelection(index,element){
    selectionIndex = selectedStakes.indexOf(index);
    if(selectionIndex>-1){
      element.classList.remove("Selected");
      selectedStakes.splice(selectionIndex, 1);
      if(selectedStakes.length!=0){
        setUnstakeButtonText("Unstake ("+selectedStakes.length+")");
      }
      else{
        setUnstakeButtonText("Unstake");
      }
      return;
    }
    element.classList.add("Selected");
    selectedStakes.push(index);
    setUnstakeButtonText("Unstake ("+selectedStakes.length+")");
  }
 
  async function stake(){
    if(!isConnected){window.alert("Wallet not Detected"); return;}
    if(selectedStakes.length==0){window.alert("No Bears Selected");return;}
    let config;
    if(selectedStakes.length==1){
      config = await prepareWriteContract({
        address: contractAddress,
        abi: ABI,
        functionName: 'stake',
        args: [selectedStakes[0]],
      }).catch((error)=>{window.alert("Txn will fail")});
    }
    else{
      const addresses = [];
      const tokenIds = [];
      for(let i=0;i<selectedNFTs.length;i++){
        addresses.push(selectedNFTs[i].address);
        tokenIds.push(selectedNFTs[i].tokenId);
      }
      config = await prepareWriteContract({
        address: contractAddress,
        abi: ABI,
        functionName: 'stakeMultiple',
        args: [addresses,tokenIds],
      }).catch((error)=>{window.alert("Txn will fail")});
    }
    if(config!=undefined){
      await writeContract(config).catch((error)=>{window.alert("Failed to Stake")});
      hideInventory();
      loadDashboard();
    }
  }
  
  async function unStake(){
    if(!isConnected){window.alert("Wallet not Detected"); return;}
    if(selectedStakes.length==0){window.alert("No Stakes Selected");return;}
    let config;
    if(selectedStakes.length==1){
      config = await prepareWriteContract({
        address: contractAddress,
        abi: ABI,
        functionName: 'unstake',
        args: [selectedStakes[0]],
      }).catch((error)=>{window.alert("Cannot Unstake")});
    }
    else{
      config = await prepareWriteContract({
        address: contractAddress,
        abi: ABI,
        functionName: 'unstakeMultiple',
        args: [selectedStakes],
      }).catch((error)=>{window.alert("Cannot Unstake")});
    }
    if(config!=undefined){
      await writeContract(config).catch((error)=>{window.alert("Failed to Unstake")});
      loadDashboard();
    }
  }

  async function harvest(){
    if(!isConnected){window.alert("Wallet not Detected");return;}
    let config = await prepareWriteContract({
      address: contractAddress,
      abi: ABI,
      functionName: 'harvestAllStakes',
    }).catch((error)=>{window.alert("Cannot Harvest")});
    if(config!=undefined){
      await writeContract(config).then(()=>{loadDashboard()}).catch((error)=>{window.alert("No Points to Harvest")});
      loadDashboard();
    }
  }

  async function hideContent(){
    setMyStakedAmount("...");
    setMyBalance("...");
    setMyEarnings("...");
    setMyStakes(<h2>No Stakes Found...</h2>);
    selectedNFTs.length=0;
    selectedStakes.length=0;
  }

  function getEmptyInventory(){
    return <h3 className='EmptyInventory'>No NFT's Found...</h3>
  }
  let lastInventoryLoad=0;
  const [inventoryDisplay,setInventoryDisplay] = useState("none");
  const [myInventory,setMyInventory] = useState(getEmptyInventory());
  
  function getInventoryCard(asset){
    //const multiplier = "100";
    //TODO get staking percent multiplier with wagmi viem
    return <div className="InventoryCard" key={asset.contractAddress+asset.token_id} onClick={(event)=>{toggleInventorySelection(asset,event.target)}}>
      <span>#{`${asset.token_id}`}</span>
      <br/>
      <img src={`${asset.content_uri}`}/>
    </div>;
  }

  async function confirmApproval(nftAddress){
    let passed = false;
    const data = await readContract({
      address: nftAddress,
      abi: NFTABI,
      functionName: 'isApprovedForAll',
      args: [wallet,contractAddress],
    });
    if(data==true){
      return true;
    }
    passed = true;
    await writeContract({
      address: nftAddress,
      abi: NFTABI,
      functionName: 'setApprovalForAll',
      args: [contractAddress,true],
    }).catch((error)=>{passed = false});
    return passed;
  }

  const [overflowY,setOverflowY] = useState("scroll");
  async function loadInventory(nftAddress){
    if(!isConnected){window.alert("Wallet not detected");return;}
    if((await confirmApproval(nftAddress))==false){return;}
    const time = Date.now();
    if(time-lastInventoryLoad<2000){
      return;
    }
    setOverflowY("hidden");
    lastInventoryLoad = Date.now();
    setInventoryDisplay("block");
    let inventory=[];
    inventory = <h3 className='EmptyInventory'>
      Loading
      <span className='Dot1'>.</span>
      <span className='Dot2'>.</span>
      <span className='Dot3'>.</span>
    </h3>;
    setMyInventory(inventory);
    inventory=[];
    let nextPage;
    let response;
    let count=0;
    do{
      //response = await axios.get(`https://polygonapi.nftscan.com/api/v2/account/own/0x4c36d7c23defc1187126ec97f2481bbe518646a8`, {
      response = await axios.get(`https://polygonapi.nftscan.com/api/v2/account/own/${wallet}`, {
          headers:{
            'X-API-KEY': 'FdQ0N9LCyiyCryprRraEJohO'
          },
          params: {
              contract_address: nftAddress,
              erc_type: "erc721",
              show_attribute: false,
              limit:100,
              cursor:nextPage
          }
      });
      if(response.data.data!=null){
        for(let x of response.data.data.content){
          inventory.push(getInventoryCard(x,nftAddress));
        }
        nextPage = response.data.data.next;
        count+=response.data.data.content.length;
        if(count==response.data.data.total){
          nextPage=null;
        }
      }
    }
    while(nextPage!=null)

    if(count==0){
      setMyInventory(getEmptyInventory());
      return;
    }
    inventory.sort((a, b) => Number(a.key) - Number(b.key));
    //console.log(inventory);
    setMyInventory(inventory);
  }
  async function hideInventory(){
    selectedNFTs.length=0;
    setOverflowY("scroll");
    setInventoryDisplay("none");
    setMyInventory(getEmptyInventory());
  }
  
  return (
    <div className="App" style={{overflowY: overflowY}}>
      <Web3Modal projectId={projectId} ethereumClient={ethereumClient} 
      themeVariables={{
        '--w3m-font-family': 'Roboto, sans-serif',
        '--w3m-accent-color': '#ad0009',
        '--w3m-text-medium-regular-weight':'300',
  }}/>
      <div style={{position:"fixed",zIndex:"3",width:"100%"}}>
        <Navbar className="Navbar">
          <div className='Hamburger' >
            <Hamburger size="44" duration={0.3} onToggle={toggled => {
              let hamburger = document.getElementsByClassName("Hamburger")[0];
              if (toggled) {
                // open a menu
                hamburger.style.color="#cb242b";
                expandSidebar();

              } else {
                // close a menu
                hamburger.style.color="white";
                collapseSidebar();
              }
            }}/>
          </div>
          <img className='LogoText' src={LogoText} alt="Rival Bears"/>
          <img className="Logo" src={LostTribes} alt="Logo"/>
        </Navbar>
        <table className='Sidebar' frame="void">
          <tbody>
            <tr>
              <td className='SidebarOption'>
                <a  target="_blank" href="http://rivalbears.io" style={{textDecoration:"none",color:"inherit"}}>
                  Home
                </a>
              </td>
            </tr>
            <tr>
              <td className='SidebarOption'>
                <a  target="_blank" href="https://magiceden.io/collections/polygon/rival_bears" style={{textDecoration:"none",color:"inherit"}}>
                    Rival<br/>Bears
                </a>
              </td>
            </tr>
            <tr>
              <td className='SidebarOption'>
                <a  target="_blank" href="https://magiceden.io/collections/polygon/mad_honey" style={{textDecoration:"none",color:"inherit"}}>
                  Mad<br/>Honey
                </a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className='MainPanel'>
        <div style={{position:"relative",marginBottom:"8vmin"}}>
          <Web3Button className='Web3Button'/></div>
          <div className='Heading'>
            STATS
          </div>
          <div className='ContentBox'>
            <h3>
              Bears Staked -&nbsp; <span>{totalStakes}</span>
            </h3>
            <h3>
              Total Honey Points -&nbsp; <span>{totalHarvested}</span>
            </h3>
            <hr/>
            <h3 id="myStakedAmount">
              My Stakes -&nbsp; <span>{myStakedAmount}</span>
            </h3>
            <h3 id="myBalance">
              My Balance -&nbsp; <span>{myBalance}</span>
            </h3>
            <h3 id="myEarnings">
              My Earned Points -&nbsp; <span>{myEarnings}</span>
            </h3>
            <button className='DashboardButton' onClick={harvest}>Harvest</button>
          </div>

          <div className='StakingBox'>
            <div className='Heading'>
              STAKING
            </div>
            <div  style={{display:"flex",marginTop:"6vmin",marginBottom:"5vmin"}}>
              <div className='StakeChoice' onClick={()=>{loadInventory(rivalBears)}}>
                <h2 onClick={()=>{loadInventory(rivalBears)}}>Rival <br/> Bears</h2>
                <img src={Logo} alt="Rival Bears - Original" style={{filter:" invert(100%)"}}/>
              </div>
              <div className='StakeChoice' onClick={()=>{loadInventory(madHoney)}}>
                <h2>Mad <br/> Honey</h2>
                <img src={MadHoneyLogo} alt="Rival Bears - Mad Honey"/>
              </div>
            </div>
          </div>

          <div className='Heading' style={{paddingBottom:"0.5vmin"}}>
            My Stakes
            <br/>
            <span>
              <button className='DashboardButton'style={{marginTop:"1vmin"}} onClick={unStake}>{unstakeButtonText}</button>
            </span>
          </div>
          <div className='StakeDisplay'>
            {myStakes}
          </div>
      </div>
      
      <div id="InventoryBox" className='InventoryBox' style={{display:inventoryDisplay}}>
        <div className='InventoryHeader'>
          <div className='DashboardButton StakeButton' style={{visibility:"hidden"}}>&nbsp;X&nbsp;</div>
          <button className='DashboardButton StakeButton'onClick={stake}>Stake</button>
          <button className='DashboardButton StakeButton' onClick={hideInventory}>&nbsp;X&nbsp;</button>
        </div>
        <div className='Inventory'>
          {myInventory}
        </div>
      </div>
    </div>
  );
}

export default App;
