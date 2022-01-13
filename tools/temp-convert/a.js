(e=>{document.addEventListener("keydown",t=>{"i"!=document.activeElement.alt&&e.focus()})})(document.getElementById("i"));
(()=>{
    var temp_i=document.getElementById("i"),ttype=document.getElementById("temp"),c=document.getElementById("q"),f=document.getElementById("w"),k=document.getElementById("e"),r=document.getElementById("r");

    var u=function(){
        function toC(n,o){return"c"==o?n:"f"==o?5*(n-32)/9:"k"==o?n-273.15:"r"==o?5*n/4:void 0}

        function toF(a){
            return (toC(a,ttype.value)*9/5)+32;
        }
        function toK(a){
            return new Number(toC(a,ttype.value))+273.15;
        }
        function toR(a){
            return toC(a,ttype.value)*4/5;
        }
        c.innerText=toC(temp_i.value,ttype.value);
        f.innerText=toF(temp_i.value);
        k.innerText=toK(temp_i.value);
        r.innerText=toR(temp_i.value);

    };
    temp_i.addEventListener('input',u);
    ttype.onchange=u;
    u();
})();
