let i=document.getElementById("i"),
g=document.getElementById("g"),
res=document.getElementById("res"),
l=document.getElementById("l");
// random int function
function ri(a,b){return Math.floor(Math.random()*(b-a+1)+a)}
g.addEventListener("click",function(){
    let v = parseInt(i.value);
    let calculations=[v];
    let operators=[];
    let length = l.value;
    for(let j=0;j<length;j++){
        var ra=ri(-10000,10000);
        var op=ri(0,2);
        if(op==0){
            calculations.push(ra*-1);
        } else if(op==1){
            calculations.push(ra*-1);
        }
    }
    let result = calculations.reduce((a,b)=>{
        let op=ri(0,2);
        if(op==0){
            operators.push(" + ");
            return a+b;
        } else {
            operators.push(" - ");
            return a-b;
        }
    });
    console.log(operators)
    calculations.push(result);
    calculations.reverse()
    operators.reverse()
    operators.forEach((e,i)=>{
        if(e==' + ')operators[i]=' - '
        else if(e==' - ')operators[i]=' + '
    })
    let resultString='';
    // combine calculations and operators
    for(let i=0;i<calculations.length;i++){
        if(i==operators.length+1){resultString+=' = '+calculations[i];}
        else if(operators[i]==undefined){resultString+=' '+calculations[i];}
        else resultString+=calculations[i].toString()+operators[i];
    }
    res.innerHTML=resultString;
});
