import axios from 'axios'
import { useEffect, useState } from 'react'
import './Staff.css'

export function Staff(){

    const [staff, setStaff] = useState([])
    useEffect(() => {
      axios.get('http://localhost:3001/staff/').then((response)=>{
        setStaff(response.data)})
    }, [])

    function searchStaff(staffName){
      if(staffName.length !== 0){
        const request = staffName[0].toUpperCase() + staffName.slice(1);
        axios.get(`http://localhost:3001/search/${request}`).then((response)=>{
            setStaff(response.data["staff"])})
      }
      else{
        axios.get('http://localhost:3001/staff/').then((response)=>{
            setStaff(response.data)})
      }
    }

    return (
      <div class="container">
      <div class="col">
        <div class="row-sm">
          <input 
              class="form-control mr-sm-2" 
              type="search" 
              placeholder="..." 
              aria-label="Search"
              onChange = {(event) => 
                {
                  searchStaff(event.target.value)
                }}
              />
        </div>
        <div class="scrollStaff">
          <div class="list-group" aria-current="true">
            {
              staff.map((person) => {
                return <button type="button" class="list-group-item list-group-item-action">{person.name}</button>
              })
            }
          </div>
        </div>
      </div>
    </div>
  );
}