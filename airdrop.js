import snapshot from './vertopal.com_snapshot.json';

function newHolder(_address){
  return {
    address:_address,
    bears:[0,0,0,0,0,0],
    //[sun,panda,black,polar,grizzly,legendary_groups]
  }
}

function getNumEntries(traits){
  let i=0;
  try{
    if(traits.includes("Vulcan")){
      i++;
    }
    if(traits.includes("Dead")){
      i++;
    }
    else if(traits.includes("Gummy")){
      i++;
    }
    else if(traits.includes("Bushido")){
      i++;
    }
    else if(traits.includes("Bearzilla")){
      i++;
    }
    else if(traits.includes("Queen")){
      i++;
    }
    else if(traits.includes("Raiden")){
      i++;
    }
    else if(traits.includes("Snake Eyes")){
      i++;
    }
    if(traits.includes("Carnage")){
      i++;
    }
    if(traits.includes("Super Bear")){
      i++;
    }
    if(traits.includes("Trippy")){
      i++;
    }
    if(traits.includes("Hellhound")){
      i++;
    }
    if(traits.includes("Sun God")){
      i++;
    }
  }catch(e){console.log(e)}
  return i;
}
var holders={};
const addresses = Object.keys(snapshot)[0].split('\n');
for(let i=0;i<addresses.length;i++){
  //console.log(addresses[i])
  holders[addresses[i]] = newHolder(addresses[i]);
}

async function getWinner(){
  const endpoint = "https://convincing-snowy-bridge.matic.discover.quiknode.pro/c82b8bdeb991f6255af6a60c982c60bfd8146404/";
  const contract = "0xa25541164ae9D59322b59fe94a73869b494c3691";
  let legendaryHolders=[];
  for(var key in holders){
    //console.log(holders[key]);
    let page = 1;
    let perPage = 40;
    let hasMorePages = true;
    document.getElementById("winner").innerHTML="Checking Bears for...<br/>"+key;
    while (hasMorePages) {
      var myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");
      var raw = JSON.stringify({
        "id": 67,
        "jsonrpc": "2.0",
        "method": "qn_fetchNFTs",
        "params": [{
          "wallet": holders[key].address,
          "page": page,
          "perPage": perPage,
          "contracts": [contract]
        }]
      });

      var requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: raw,
        redirect: 'follow'
      };

      let response = await fetch("https://convincing-snowy-bridge.matic.discover.quiknode.pro/c82b8bdeb991f6255af6a60c982c60bfd8146404/", requestOptions);
      let json = await response.json();
      if(json==undefined){
        break;
      }
      //console.log(json.result);
      //console.log(json.result.assets[0].traits[5].value);
      for(let j=0;j<json.result.assets.length;j++){
        let bearTypeIndex = getBearType(json.result.assets[j].traits[5].value);
        if(bearTypeIndex!==-1){
          holders[key].bears[bearTypeIndex]++;
          //an "legendary holder" set of all 5 bears can only occur when a new bear is being added
          if(hasLegendarySet(holders[key])){
            //console.log("legendary set found - "+nft.owner_of);
            holders[key].bears[0]--;
            holders[key].bears[1]--;
            holders[key].bears[2]--;
            holders[key].bears[3]--;
            holders[key].bears[4]--;
            holders[key].bears[5]++;
            legendaryHolders.push(key);
            //console.log("adding legendary holder"+key);
          }
        }
      }//while loop for holder's NFT's looping paged data
      if (json.result.pageNumber == json.result.totalPages) {
        hasMorePages = false;
      }
      page++;
      await new Promise(resolve => setTimeout(resolve, 40));
    }
    
  }//while loop for all holders
  
  document.getElementById("winner").innerHTML="Picking winner.";
  await new Promise(resolve => setTimeout(resolve, 300));
  document.getElementById("winner").innerHTML="Picking winner..";
  await new Promise(resolve => setTimeout(resolve, 300));
  document.getElementById("winner").innerHTML="Picking winner...";
  await new Promise(resolve => setTimeout(resolve, 500));

  const d = new Date();
  const time = Math.round(Math.random()+(d.getTime()));
  const randomIndex = Math.floor(Math.random() + time)%legendaryHolders.length;
  
  return "Winner is: <br/>" + legendaryHolders[randomIndex];
}

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
            getWinner().then((winner)=>{
              document.getElementById("winner").innerHTML=winner;
            }).catch(console.error);
          }}>Pick a Winner</button>
          <h2 id="winner">...</h2>
        </div>
      </center>
    </div>
  );
}

export default App;
