let b = document.createElement('div')
b.className='block'
b.style.transform='translate(0px,500px)'

function clone(y){
    cz = b.cloneNode()
    cz.style.transform=`translateY(${y}px)`
    py=y;
    blocks_x++;
    return cz
}
let py=600;
let blocks_x = 0
let intv = setInterval(() => {
    let all = [...document.getElementsByClassName('block')]
    if(all.length>28){
        all.forEach((a)=>a.remove())
    }
    if(py<210){
        py=600
        all.forEach((a)=>a.remove())
    }
    if(blocks_x==8){
        py-=22;blocks_x=0
    }
    
    document.body.appendChild(clone(py))
}, 236)
