console.log('pants')

const rando = 'https://randomuser.me/api/?results=12'

function fetchData(url){
    return fetch(url)
             .then(response => response.json())
             .catch(err => console.log(err))
   }