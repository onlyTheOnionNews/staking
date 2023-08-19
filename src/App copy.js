import logo from './logo.png'
import './App.css';
import Moralis from 'moralis';

await Moralis.start({
  apiKey: "V4GdcKhA4s0z0VOitYjyyJKLYUe6bAMvjhSGNmsn9PW8zRGouNLWIFjpP79lb5xQ",
  // ...and any other configuration
});

function newHolder(_address){
  return {
    address:_address,
    bears:[0,0,0,0,0,0],
    //[sun,panda,black,polar,grizzly,legendary_groups]
  }
}

function getBearType(fur){
  try{
    if(" Dead Sun Gold-Plated Natural Sun Radiant Sun Glow ".includes(fur)){
      return 0;
    }
    if(" Black Steel Dead Flame Fire Glow Lava Natural Panda ".includes(fur)){
      return 1;
    }
    if(" Dead Aqua Shark Skin Purple-Iron Natural Black Hydro Glow ".includes(fur)){
      return 2;
    }
    if(" Blue Steel Dead Ice Ice Glow Natural Polar Sculpture ".includes(fur)){
      return 3;
    }
    if(" Dead Wood Forest Glow Natural Grizzly Rusted Metal Terra Forest ".includes(fur)){
      return 4;
    }
  }catch{}
  return -1;
}
function hasLegendarySet(holder){
  return 0!==holder.bears[0]*holder.bears[1]*holder.bears[2]*holder.bears[3]*holder.bears[4];
}
async function getWinner(maxNFTs){
//async function getWinner(maxPages){
  const options = {
    "chain":"0x89",
    "address":"0xa25541164ae9D59322b59fe94a73869b494c3691",
    "normalizeMetadata":true,
    "mediaItems":false,
  };
  var legendaryHolders = [];
  let page=0;
  var holders={};
  for (let i = 0; i < maxNFTs; i++) {
    document.getElementById("winner").innerHTML="Scanning Bear #"+i ;
    const response = await Moralis.EvmApi.nft.getNFTTokenIdOwners({
      "chain": "0x89",
      "format": "decimal",
      "normalizeMetadata": true,
      "mediaItems": false,
      "address": "0xa25541164ae9D59322b59fe94a73869b494c3691",
      "tokenId": i.toString()
    });
    let nft = response.jsonResponse.result[0];
    //console.log(nft);
    if(Object.keys(holders).includes(nft.owner_of)==false){
      let holder = newHolder(nft.owner_of);
      holders[nft.owner_of] = holder;
    }
    let bearTypeIndex = getBearType(nft["normalized_metadata"]["attributes"][2]["value"]);
    if(bearTypeIndex!==-1){
      holders[nft.owner_of].bears[bearTypeIndex]++;
      //an "legendary holder" set of all 5 bears can only occur when a new bear is being added
      if(hasLegendarySet(holders[nft.owner_of])){
        //console.log("legendary set found - "+nft.owner_of);
        holders[nft.owner_of].bears[0]--;
        holders[nft.owner_of].bears[1]--;
        holders[nft.owner_of].bears[2]--;
        holders[nft.owner_of].bears[3]--;
        holders[nft.owner_of].bears[4]--;
        holders[nft.owner_of].bears[5]++;
        legendaryHolders.push(nft["owner_of"]);
      }
    }
    await new Promise(resolve => setTimeout(resolve, 17));
  }
  /*while (page<maxPages) {
  //while (page<50) {
    let response = await Moralis.EvmApi.nft.getNFTOwners(options);
    if (response.length === 0) {
      break;
    }
    let nfts = response.toJSON().result;
    options.cursor=response.cursor;
    if (nfts.length === 0) {
      break;
    }
    let holders = {};
    console.log(nfts);
    for(let key in nfts){
      let nft = nfts[key];
      if(!(nft["owner_of"] in holders)){
        holders[nft.owner_of] = newHolder(nft.owner_of);
        console.log(holders[nft.owner_of]);
      }
      try{
        let bearTypeIndex = getBearType(nft["normalized_metadata"]["attributes"][2]["value"]);
        console.log(nft["normalized_metadata"]["attributes"]);
        if(bearTypeIndex!==-1){
          holders[nft.owner_of].bears[bearTypeIndex]++;
          //an "legendary holder" set of all 5 bears can only occur when a new bear is being added
          if(hasLegendarySet(holders[nft.owner_of])){
            //console.log("We have one");
            holders[nft.owner_of].bears[0]--;
            holders[nft.owner_of].bears[1]--;
            holders[nft.owner_of].bears[2]--;
            holders[nft.owner_of].bears[3]--;
            holders[nft.owner_of].bears[4]--;
            holders[nft.owner_of].bears[5]++;
            legendaryHolders.push(nft["owner_of"]);
          }
        }
      }catch(e){}
    }
    let displayText = "Searching Bears #0 - #"+((page*100)-1+"...");
    //console.log(displayText);
    document.getElementById("winner").innerHTML=displayText;
    await new Promise(resolve => setTimeout(resolve, 300));
    page++;
  }*/
  if(legendaryHolders.length===0){
    //console.log("No Legendary Holders Found");
    return "No Legendary Holders Found";
  }
  const d = new Date();
  const time = Math.round(Math.random()+(d.getTime()));
  const randomIndex = Math.floor(Math.random() + time)%legendaryHolders.length;
  //const randomIndex = Math.floor(Math.random() * legendaryHolders.length);
  //console.log(legendaryHolders[randomIndex]);
  /*console.log(legendaryHolders);
  console.log("legedary holder #"+randomIndex);
  console.log(legendaryHolders[randomIndex]);*/
  return legendaryHolders[randomIndex];
}
getWinner();
function App() {
  return (
    <div className="App">
      <center>
        <div className="panel">
          <h1>Rival Bears</h1>
          <h1>Legendary Holder Lottery</h1>
          <img src={logo} alt="Rival Bear Society logo"/>
          <br/>
          <button id="button" onClick={()=>{
            let button = document.getElementById("button");
            button.disabled=true;
            getWinner(5000).then((winner)=>{
              document.getElementById("winner").innerHTML=winner;
            });
          }}>Pick a Winner</button>
          <h2 id="winner">...</h2>
        </div>
      </center>
    </div>
  );
}

export default App;
