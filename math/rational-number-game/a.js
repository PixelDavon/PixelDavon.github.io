let c = document.getElementById('cnv'),qst=document.getElementById('qst');
kaboom({width:600,height:500,background:[144, 178, 232],canvas:c});
loadSprite('catcher','cart.png');
var change=(e)=>{qst.innerText=e;MathJax.typeset()}
const ri=(m,b)=>Math.round(Math.random()*(m-b))+b;
let ball_loop=true,real,catcher,score;
let SPEED=130;
// question generator but not perfect
let getQ=(nn,mx)=>{
    var loop=!1,n1=0,sqrt2=0,sqrt1=0,divide=0;
    while(!loop){
        // random number
        n1=nn?nn:ri(10,100);
        for(i=mx?mx:10; i>=2; i--){
            // if not divideable, skip
            // if square rooted number is a decimal, skip
            if(n1%i!=0||!Number.isSafeInteger(Math.sqrt(n1/i)))continue;
            sqrt2=i;
            divide=n1/i;
            sqrt1=Math.sqrt(divide);
            loop=!0;
        }
        if(nn)break;
    }
    return [n1,sqrt1,sqrt2,divide]
}
let loops=()=>{
    onUpdate(()=>{
        if(ri(0,100)>98&&ball_loop){
            var fake=real[0],fake2=real[1];
            while(fake==real[0])fake=ri(0,9);
            while(fake2==real[1])fake2=ri(0,9);
            var ans=ri(0,100)>90?real:[fake,fake2,0];
            add([area(),
                circle(30),
                'ball',
                pos(ri(10,570),10),
                origin('center'),
                text(`${ans[0]}v${ans[1]}`,{size:20}),
                {
                    correct:ans[2],
                    speed:ri(20,60)
                }
            ]);
        };
    });
    onKeyPress('r',()=>go('main'));
    onUpdate('ball',(obj)=>{obj.move(ri(-10,10),obj.speed)});
    catcher.onCollide('ball',(b)=>{
        if(b.correct){
            score.addScore();
            if(score.v==6){
                every(destroy)
                ball_loop=false;
                add([pos(300,30),origin('center'),text('u win',{size:50})])
            }
            every('ball',destroy)
            return start();
        }
        every(destroy)
        ball_loop=false;
        add([pos(300,30),origin('center'),text('u died, press r',{size:50})])
    });
};
let start=()=>{
    var q=getQ();
    real=[q[1],q[2],1]
    console.log(q)
    change(`\\[\\sqrt{${q[0]}}\\]`)
}
function main(){
    ball_loop=true;
    score = add([
        text("Score:",{size:32}),{v:0,addScore:()=>{score.v++;score.text='Score: '+score.v},resetScore:()=>{score.v=0;score.text='Score:'}}
    ])
    catcher = add([
        sprite('catcher'),
        pos(270,460),
        area()
    ])
    // movement
    onKeyDown('left',()=>catcher.move(-SPEED,0))
    onKeyDown('right',()=>catcher.move(SPEED,0))
    start();
    loops();
}
scene('main',main);
main();
start();
