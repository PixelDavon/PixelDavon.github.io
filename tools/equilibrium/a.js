(()=>{
    let dd = document.getElementById("d"),
    ss = document.getElementById("s"),
    d22=document.getElementById("d2"),
    s22=document.getElementById("s2"),
    submit=document.getElementById("submit"),
    r=document.getElementsByClassName("r"),
    f=document.getElementsByClassName("f");

    submit.addEventListener('click',e=>{
        let dcal='',
        scal='',
        pcal='';

        var d=dd.value;
        var s=ss.value;
        var d2=d22.value;
        var s2=s22.value;
        if(d==""||s==""){
            return alert("Please fill the fields");
        }
        if(d2==""){
            if(s2=="")return alert("Please fill the fields");
            let price=(()=>{
                var z=d-s;
                var z1=s2+1;
                var x=z/z1;
                
                pcal=
`${d}-P=${s}+${s2}P
${d}-${s}=${s2}+1P
${z}=${z1}
${z}/${z1}=${x}
`
                return x
            })();
            let demand=d-s;
            dcal=
`Qd=${d}-P
Qd=${d}-${s}
Qd=${demand}
`
            
            let supply=s+(s2*price)
            scal=
`Qs=${s}+${s2}P
Qs=${s}+(${s2}*${price})
Qs=${s}+${s2*price}
Qs=${supply}
`;
            let iseq=demand==supply?'Yes':'No';
            r[0].innerText=price;
            r[1].innerText=demand;
            r[2].innerText=supply;
            r[3].innerText=iseq;
        }
        else if(s2==""){
            if(d2=="")return alert("Please fill the fields");
            let price=(()=>{
                var z=d-d2;
                var x=z/s;

                pcal=
`${d}-${d2}=${s}Q
${z}=${s}Q
${z}/${s}=${x}
Q=${x}`;

                return x;
            })();
            let demand=d-d2;
            dcal=
`D=${d}-${d2}
 =${demand}`;
            let supply=s*price;
            scal=
`S=${s}
 =${s} x ${price}
 =${supply}`;
            let iseq=demand==supply?'Yes':'No';
            r[0].innerText=price;
            r[1].innerText=demand;
            r[2].innerText=supply;
            r[3].innerText=iseq;
        }else{
            let price=(()=>{
                var x=d-s;
                var x2=d2-s2;
                var c=x/x2;
                pcal=
`${d}-${d2}=${s}-${s2}
${d}-${s}=${d2}-${s2}
${x}=${x2}
${x}/${x2}=${c}
P=${c}`;
                return c;
            })();
            let demand=(()=>{
                var z=d-(d2*price);
                dcal=
`D=${d}-${d2}P
 =${d}-(${d2} x ${price})
 =${d} - ${d2*price}
 =${z}`;
                return z;
            })();
            let supply=(()=>{
                var z=s-(s2*price);
                scal=
`S=${s}-${s2}P
 =${s}-(${s2} x ${price})
 =${s} - ${s2*price}
 =${z}`;
                return z;
            })();
            let iseq=demand==supply?'Yes':'No';
            r[0].innerText=price;
            r[1].innerText=demand;
            r[2].innerText=supply;
            r[3].innerText=iseq;
        }
        f[0].innerText=dcal;
        f[1].innerText=scal;
        f[2].innerText=pcal;

    });
})();
