(window.webpackJsonp=window.webpackJsonp||[]).push([[0],{23:function(e,t,a){e.exports=a(37)},28:function(e,t,a){},37:function(e,t,a){"use strict";a.r(t);var n=a(0),r=a.n(n),s=a(19),o=a.n(s),c=(a(28),a(2)),i=a(3),l=a(5),d=a(4),u=a(6),p=a(20),h=a(10),f=a(11),g=function(e){function t(){var e,a;Object(c.a)(this,t);for(var n=arguments.length,r=new Array(n),s=0;s<n;s++)r[s]=arguments[s];return(a=Object(l.a)(this,(e=Object(d.a)(t)).call.apply(e,[this].concat(r)))).state={},a.selectCard=function(){a.props.selectCardFn(a.props.objKey)},a.getDisplayValue=function(e){var t=e+1;if(t>1&&t<=10)return t.toString();switch(t){case 1:return"A";case 11:return"J";case 12:return"Q";case 13:return"K";default:return"E"}},a}return Object(u.a)(t,e),Object(i.a)(t,[{key:"render",value:function(){return r.a.createElement("div",{onClick:this.selectCard,style:{boxSizing:"border-box",border:this.props.selected?"2px solid red":"1px solid grey",borderRadius:10,height:this.props.height,width:this.props.width,padding:5,color:"\u2665"===this.props.suit||"\u2666"===this.props.suit?"red":"black",backgroundColor:"white",marginTop:this.props.verticalMargin,position:"relative",zIndex:this.props.dispIndex||0}},this.props.suit,this.getDisplayValue(this.props.rank))}}]),t}(n.Component),m=function(e){function t(){return Object(c.a)(this,t),Object(l.a)(this,Object(d.a)(t).apply(this,arguments))}return Object(u.a)(t,e),Object(i.a)(t,[{key:"render",value:function(){var e=this;return r.a.createElement("div",{style:{border:"1px solid grey",width:this.props.width,height:this.props.height,backgroundColor:"cream",margin:this.props.cardMargins/2},onClick:function(){null===e.props.card&&e.props.selectEmptySquareFn(e.props.location)}},null!==this.props.card?r.a.createElement(g,{suit:this.props.card.suit,rank:this.props.card.rank,height:this.props.height,width:this.props.width,selected:this.props.card.selected,selectCardFn:this.props.selectCardFn,objKey:this.props.card.rank+this.props.card.suit}):null)}}]),t}(n.Component),y=function(e){function t(){var e,a;Object(c.a)(this,t);for(var n=arguments.length,r=new Array(n),s=0;s<n;s++)r[s]=arguments[s];return(a=Object(l.a)(this,(e=Object(d.a)(t)).call.apply(e,[this].concat(r)))).state={},a}return Object(u.a)(t,e),Object(i.a)(t,[{key:"render",value:function(){var e=this;return r.a.createElement("div",{style:{border:"1px solid grey",width:this.props.width,height:this.props.height,backgroundColor:"cream",margin:this.props.cardMargins/2},onClick:function(){e.props.cards.length||e.props.selectEmptySquareFn(e.props.location)}},this.props.cards&&this.props.cards.length?r.a.createElement(g,{suit:this.props.cards[this.props.cards.length-1].suit,rank:this.props.cards[this.props.cards.length-1].rank,height:this.props.height,width:this.props.width,selected:this.props.cards[this.props.cards.length-1].selected,selectCardFn:this.props.selectCardFn,key:this.props.cards[this.props.cards.length-1].rank+this.props.cards[this.props.cards.length-1].suit,objKey:this.props.cards[this.props.cards.length-1].rank+this.props.cards[this.props.cards.length-1].suit}):null)}}]),t}(n.Component),C=function(e){function t(){return Object(c.a)(this,t),Object(l.a)(this,Object(d.a)(t).apply(this,arguments))}return Object(u.a)(t,e),Object(i.a)(t,[{key:"render",value:function(){var e=this,t=-this.props.cardHeight+Math.round(.33*this.props.cardHeight);return r.a.createElement("div",{style:{paddingTop:-t,paddingLeft:this.props.cardMargins/2,paddingRight:this.props.cardMargins/2,border:"1px solid grey",width:this.props.cardWidth,minHeight:this.props.cardHeight}},this.props.cards&&this.props.cards.length?this.props.cards.map(function(a,n){return r.a.createElement(g,{rank:a.rank,suit:a.suit,height:e.props.cardHeight,width:e.props.cardWidth,verticalMargin:t,selectCardFn:e.props.selectCardFn,selected:a.selected,key:a.rank+a.suit,location:e.props.location,index:n,objKey:a.rank+a.suit,maxIndex:e.props.cards.length-1,dispIndex:n})}):null)}}]),t}(n.Component),v=["\u2663","\u2666","\u2665","\u2660"],k=function(e){function t(){var e,a;Object(c.a)(this,t);for(var n=arguments.length,r=new Array(n),s=0;s<n;s++)r[s]=arguments[s];return(a=Object(l.a)(this,(e=Object(d.a)(t)).call.apply(e,[this].concat(r)))).state={cards:{},gameInProgress:!1,cascades:[[],[],[],[],[],[],[],[]],freeCells:[null,null,null,null],foundations:[[],[],[],[]],selectedKey:null,width:0,height:0},a.componentDidMount=function(){a.updateWindowDimensions(),window.addEventListener("resize",a.updateWindowDimensions)},a.componentWillUnmount=function(){window.removeEventListener("resize",a.updateWindowDimensions)},a.updateWindowDimensions=function(){a.setState({width:window.innerWidth,height:window.innerHeight})},a.generateCards=function(){var e={};v.forEach(function(t){for(var a=0;a<=12;a++)e[a+t]={suit:t,rank:a,location:null,selected:!1,objKey:a+t}}),a.setState({cards:e},function(){a.shuffleCards()})},a.shuffleCards=function(){var e=[];v.forEach(function(t){for(var a=0;a<=12;a++)e.push({suit:t,rank:a})});var t=e.map(function(e){return[Math.random(),e]}).sort(function(e,t){return e[0]-t[0]}).map(function(e){return e[1]}),n=Object(f.a)({},a.state.cards);t.forEach(function(e,t){var a=t%8,r=Math.floor(t/8),s=e.rank+e.suit;n[s].location="cascade",n[s].column=a,n[s].position=r}),a.setState({cards:n},function(){a.displayCards()})},a.cardsCanStack=function(e,t,n){var r=a.state.cards[e],s=a.state.cards[t];return"cascade"===n?(console.log("Checking for cascade stack."),s.rank-1===r.rank&&a.getCardColor(s)!==a.getCardColor(r)):"foundation"===n?(console.log("Checking for foundation stack."),s.suit===r.suit&&s.rank+1===r.rank):(console.error("GameArea.jsx -> cardsCanStack function: incorrect stack type specified"),!1)},a.displayCards=function(){var e=Object(f.a)({},a.state.cards),t=[[],[],[],[],[],[],[],[]],n=[[],[],[],[]],r=[null,null,null,null];for(var s in e)"cascade"===e[s].location?t[e[s].column][e[s].position]=e[s]:"foundation"===e[s].location?n[e[s].column][e[s].position]=e[s]:"freeCell"===e[s].location&&(r[e[s].column]=e[s]);console.log("cards:",e),console.log("foundations: ",n),console.log("cascades: ",t),a.setState({cards:e,cascades:t,foundations:n,freeCells:r,selectedKey:null})},a.selectEmptySquareFn=function(e){var t=a.state.selectedKey;if(t){var n=e.match(/(\w+)(\d+)/),r=n[1],s=n[2];"foundation"===r?a.checkToStackCardOnFoundation({cardKey:t,column:s}):"freeCell"===r&&a.checkToMoveToFreeCell({cardKey:t,column:s})}},a.selectCardFn=function(e){console.log("selecting card, key is:",e);var t=Object(f.a)({},a.state.cards);if(a.state.selectedKey&&a.state.selectedKey===e)return t[e].selected=!1,void a.setState({cards:t,selectedKey:null});if(!a.state.selectedKey)return t[e].selected=!0,void a.setState({cards:t,selectedKey:e});console.log("Checking to move card:");var n=a.state.cards[e];console.log("destCard: ",n),console.log("destCard.location:",n.location),"foundation"!==n.location?"cascade"===n.location&&(console.log("selectCardFn: checking to move card"),a.tryToMoveToCascade({cardKey:a.state.selectedKey,column:n.column})):a.checkToStackCardOnFoundation({cardKey:a.state.selectedKey,column:n.column})},a.moveCard=function(e){var t=e.cardKey,n=e.location,r=e.column,s=e.position,o=Object(f.a)({},a.state.cards),c=o[t];console.log("Inside the moveCard fn call."),c.location=n,c.column=r,c.position=s,c.selected=!1,o[a.state.selectedKey].selected=null,a.setState({cards:o,selectedKey:null},function(){a.displayCards()})},a.checkToMoveToFreeCell=function(e){var t=e.cardKey,n=e.column;a.state.freeCells[n]?console.log("Cell must be free, duh"):(console.log("Ok, we should be good to move here..."),a.moveCard({cardKey:t,location:"freeCell",column:n,position:0}))},a.checkToStackCardOnFoundation=function(e){var t=e.cardKey,n=e.column,r=Object(f.a)({},a.state.cards),s=r[t];if(0===a.state.foundations[n].length){if(0!==s.rank)return!1}else{var o=a.state.foundations[n].length,c=a.state.foundations[n][o-1];if(s.suit!==c.suit)return!1;if(s.rank-1!==c.rank)return!1}a.moveCard({cardKey:t,location:"foundation",column:n,position:r[t].rank})},a.tryToMoveToCascade=function(e){var t=e.cardKey,n=e.column,r=Object(f.a)({},a.state.cards)[t],s=a.state.cascades[n].length,o=a.state.cascades[n][s-1];console.log("topCardInCascade: ",o),a.getCardColor(r)!==a.getCardColor(o)&&r.rank+1===o.rank&&a.moveCard({cardKey:t,location:"cascade",column:n,position:o.position+1})},a.getCardColor=function(e){return"\u2666"===e.suit||"\u2665"===e.suit?"red":"black"},a}return Object(u.a)(t,e),Object(i.a)(t,[{key:"render",value:function(){var e=this,t=Math.round(this.state.width/12),a=Math.round(1.4*t),n=Math.round(.02*this.state.width);return r.a.createElement("div",{style:{}},r.a.createElement("button",{onClick:this.generateCards},"Shuffle Deck"),r.a.createElement("span",null," (Warning - this will end your current game.)"),r.a.createElement("div",{style:{display:"flex",justifyContent:"center"}},r.a.createElement("div",{style:{margin:n}},r.a.createElement("h4",{style:{textAlign:"center"}},"Foundations"),r.a.createElement("div",{style:{display:"flex"}},this.state.foundations.map(function(s,o){return r.a.createElement(y,{height:a,width:t,key:"foundation"+o,location:"foundation"+o,selectCardFn:e.selectCardFn,selectEmptySquareFn:e.selectEmptySquareFn,cards:s,cardMargins:n})}))),r.a.createElement("div",{style:{margin:n}},r.a.createElement("h4",{style:{textAlign:"center"}},"FreeCells"),r.a.createElement("div",{style:{display:"flex"}},this.state.freeCells.map(function(s,o){return r.a.createElement(m,{width:t,height:a,key:"freeCell"+o,location:"freeCell"+o,selectCardFn:e.selectCardFn,selectEmptySquareFn:e.selectEmptySquareFn,card:s,cardMargins:n})})))),r.a.createElement("div",{style:{display:"flex",justifyContent:"center"}},this.state.cascades.map(function(s,o){return r.a.createElement(C,{className:"Cascade",cards:s,cardWidth:t,cardHeight:a,selectCardFn:e.selectCardFn,selectEmptySquareFn:e.selectEmptySquareFn,key:"cascade"+o,location:"cascade"+o,cardMargins:n})})))}}]),t}(n.Component),b=function(e){function t(){return Object(c.a)(this,t),Object(l.a)(this,Object(d.a)(t).apply(this,arguments))}return Object(u.a)(t,e),Object(i.a)(t,[{key:"render",value:function(){return r.a.createElement(p.a,null,r.a.createElement(r.a.Fragment,null,r.a.createElement("div",null,"ReactCell by Scott Ratigan"),r.a.createElement(h.a,{exact:!0,path:"/",component:k})))}}]),t}(n.Component);Boolean("localhost"===window.location.hostname||"[::1]"===window.location.hostname||window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/));o.a.render(r.a.createElement(b,null),document.getElementById("root")),"serviceWorker"in navigator&&navigator.serviceWorker.ready.then(function(e){e.unregister()})}},[[23,1,2]]]);
//# sourceMappingURL=main.ede776d4.chunk.js.map