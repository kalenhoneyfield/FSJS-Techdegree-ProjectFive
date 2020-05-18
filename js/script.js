/*
 * Setup the basic page elements that we will use throughout
 */

const gallery = document.getElementById('gallery')

const modal = document.createElement('div') //create an empty div to hold our modal...
modal.classList.add('modal-container', 'hidden') //keep it hidden, keep it safe

document.body.append(modal)

const searchContainer = document.querySelector('.search-container')
const searchForm = document.createElement('div')
const searchInput = document.createElement('input')
const searchSubmit = document.createElement('input')

searchInput.type = 'search'
searchInput.id = 'search-input'
searchInput.classList.add('search-input')
searchInput.placeholder = 'Search...'

searchForm.append(searchInput)
searchContainer.append(searchForm)

//lets see if we can dynamically adjust some values
const root = document.documentElement;


const rando = 'https://randomuser.me/api/?results=12&nat=us,gb'

let employeeArray = [] //initialize the array we will use to store all our employee records


//based on Guil's demo in TreeHouse
function fetchData(url){
    return fetch(url)
             .then(response => response.json())
             .catch(err => console.log(err))
   }

//lets fetch the data then adjust certain bits of it so that we have neat and tidy packages to deal with
fetchData(rando)
    .then(data => {
        data.results.map(record => {
            record.name.fullName = `${record.name.title} ${record.name.first} ${record.name.last}`
            record.location.fullAddress = `${record.location.street.number} ${record.location.street.name}, ${record.location.city}, ${record.location.state}, ${record.location.country}, ${record.location.postcode}`
            record.dob.humanBirthday = formatDateForHumans(record.dob.date)
            record.color = recordToBackgroundColorConverter(record)
        })
        return data.results
    })
    .then( data => showEmployees(data))

//roll through each item create a card for it, add it to the DOM, and then add it to an array for later use
function showEmployees(jsonArray){
    jsonArray.forEach(record => {
        const card = buildCard(record)
        gallery.append( card )
        employeeArray.push(record)
    })
}

//Build an on screen card
//assign event handler to it before handing it back
function buildCard(record){ 
    const card = document.createElement('div')
    card.classList.add('card')
    const cardData = `<div class="card-img-container">
                            <img class="card-img" src="${record.picture.medium}" alt="profile picture">
                        </div>
                        <div class="card-info-container">
                            <h3 id="name" class="card-name cap">${record.name.fullName}</h3>
                            <p class="card-text">${record.email}</p>
                            <p class="card-text cap">${record.location.city}, ${record.location.state}</p>
                        </div>`
    card.innerHTML = cardData
    card.querySelector('.card-name').style.color = record.color
    card.addEventListener('click', ()=> {
        buildModal(record, 'fromTopIntro')
    })
    return card
}

//when each record is selected, zero out any previous modal data, then build the desired modal and display it
//Since we're being fancy we'll need to know which direction to bring in the new modal
function buildModal(record, direction){ 
    const index = employeeArray.indexOf(record) //so we can find the next one
    gallery.style.filter = 'blur(1px) drop-shadow(2px 2px 2px black)'
    modal.innerHTML = ''
    const modalData = `<div class="modal">
                        <button type="button" id="modal-close-btn" class="modal-close-btn"><strong>X</strong></button>
                        <div class="modal-info-container">
                            <img class="modal-img" src="${record.picture.large}" alt="profile picture">
                            <h3 id="name" class="modal-name cap">${record.name.fullName}</h3>
                            <p class="modal-text">${record.email}</p>
                            <p class="modal-text cap">${record.location.city}</p>
                            <hr>
                            <p class="modal-text">Office: ${record.phone}</p>
                            <p class="modal-text">Cell: ${record.cell}</p>
                            <p class="modal-text">${record.location.fullAddress}</p>
                            <p class="modal-text">Birthday: ${record.dob.humanBirthday}</p>
                        </div>
                    </div>

                    <div class="modal-btn-container">
                        <button type="button" id="modal-prev" class="modal-prev btn">Prev</button>
                        <button type="button" id="modal-next" class="modal-next btn">Next</button>
                    </div>`
    modal.innerHTML = modalData
    modal.classList.remove('hidden') //lets bring it to the screen
    
    addRemoveAnimation(modal, direction) //lets get kinda fancy

    const modalBox = document.querySelector('.modal')
    modalBox.style.backgroundImage = `radial-gradient(circle at 50% 20%, #FFFFFF, ${record.color} )` //best I could figure out for the border border

    const modalImg = document.querySelector('.modal-img')
    modalImg.style.border = `10px solid ${record.color}` //if I could figure out how to put a border around the border...

    const modalXbutton = document.getElementById('modal-close-btn')
    modalXbutton.addEventListener('click', () =>{
        addRemoveAnimation(modal,'toBottomOutro', () => {
            modal.classList.add('hidden')
            gallery.style.filter = ''
        })
    })

    const modalNextbutton = document.getElementById('modal-next')
    modalNextbutton.addEventListener('click', () =>{
        addRemoveAnimation(modal,'rightOutro', () => {
            modal.classList.add('hidden')

            const nextIndex = findNextVisiable(index, 1)
            
            buildModal(employeeArray[nextIndex], 'leftIntro')
        })
        
    })

    const modalPrvbutton = document.getElementById('modal-prev')
    modalPrvbutton.addEventListener('click', () =>{
        addRemoveAnimation(modal,'leftOutro', () => {
            modal.classList.add('hidden')

            const previousIndex = findNextVisiable(index, -1)
            
            buildModal(employeeArray[previousIndex], 'rightIntro')
        })
    })

    //center the radial gradient right behind the selected employee's image
    document.body.style.backgroundImage = `radial-gradient(circle at calc(${(record.coords.x + 50) / innerWidth} * 100%) calc(${(record.coords.y + 50) / innerHeight} * 100%), #FFFFFF 0%, ${record.color} 50% )`
    root.style.setProperty('--rgb-value', record.color)
}

//since we're not requerying the api each time, we don't really need a "search button"
//lets just listen for keyups and bur events to perform the search
searchInput.addEventListener('keyup', (e)=>{
    performSearch(e)
})
searchInput.addEventListener('blur', (e)=>{
    performSearch(e)
})

//loop through all the items and either hide or unhide them based on the search 
function performSearch(e){
    if(employeeArray.length < 1){ //just in case the API hasn't reponded yet or a problem occurred, lets not attempt to query the DOM
        console.error('not ready yet')
        return null
    }
    let searchQuery = (e.target.value).toLowerCase() //allow the user to search case insensitive 
    const nameList = document.querySelectorAll('.card-name')
    nameList.forEach(name => {
        const nameTest = name.innerText.toLowerCase() //allow the user to search case insensitive
        if( !nameTest.includes(searchQuery) ){
            name.parentElement.parentElement.classList.add('hidden')
        }
        else{
            name.parentElement.parentElement.classList.remove('hidden')
        }
    })
}

/**
 * I'm sure the following will be fairly brutal on some CPUs, I'm sorry if you are reviewing this on a ChromeBook.
 * but this allows for the simpliest approach I could figure out how to
 * insure these values were accuarate if the page was resized, or if someone used the search box
 * 
 * These values are used to set the radial gradient behind each card's img
 */
document.body.addEventListener('mousemove', (e) => {
    const faces = document.querySelectorAll('.card-img')
    faces.forEach((face, idx) => {
        const coords = face.getBoundingClientRect()
        employeeArray[idx].coords = coords
    })
});

//While ISO formated dates are cool... user testing reveals mixed results
function formatDateForHumans(dateString){ 
    const date = new Date(dateString)
    let year = date.getFullYear()

    let month = date.getMonth()
    month = month > 9 ? month : '0' + month.toString()
  
    let day = date.getDate()
    day = day > 9 ? day : '0' + day.toString()
    
    return `${month}/${day}/${year}` //US based date format
  }


//just for fun lets give everyone a color derived from their birthday
function recordToBackgroundColorConverter(record){ 
    let color = new Date(record.dob.date)
    color = Math.abs( Math.floor(color.getTime() / 1000) ) //get the number of seconds its been or would be since the Epoch
    let bgColor = color.toString(16) //lets play with converting a number to a string, what could possible go wrong ¯\_(ツ)_/¯
    bgColor = "#" + (bgColor).slice(-6) //hopefully everyones date gives us at least 6 characters
    return bgColor
    }



/*
Figure out what the index value should be so we don't over run or under run our array
*/
function findIndex(val){
    const total = employeeArray.length - 1 //arrays start at 0
    return val > total ? 0 : val < 0 ? total : val //If the value is greater than the total, return 0, less than the total return total, otherwise return the value
}

/*
Find and return the next visiable card, 
if the user has narrowed down the employees to view, 
lets allow them to review just those cards/modals
*/
function findNextVisiable(val, increment){
    val = findIndex(val + increment)
    const nameList = document.querySelectorAll('.card-name')
    for(val; nameList[val].parentElement.parentElement.classList.contains('hidden'); val = findIndex(val + increment)){
        console.log(`It isn't ${nameList[val].innerText}`)
    }
    console.log(`It is ${nameList[val].innerText}`)
    return val
}

/*
Code derived from the function published at https://animate.style/
This is the site that the animate.css is now hosted at
Used in Project Four and adapted here, since we don't have animate.css
*/
const addRemoveAnimation = (elem, className, callback) => 
    new Promise((resolve, reject) => { //use a promise so we don't have to stop everything
        elem.classList.add(className)  //add the class we have CSS for that has an animation

        const hasAnimationEnded = () => { //animation ened?
            elem.classList.remove(className) //remove the class
            elem.removeEventListener('animationend', hasAnimationEnded) //remove the event listener
            
            callback ? callback() : false //if we have a callback, run it, otherwise ignore
            resolve('Animation ended') //resolve the promise
        }
        elem.addEventListener('animationend', hasAnimationEnded) //add an event handler to listen for when the animation has ended
});