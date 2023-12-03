import axios from 'axios'
import { useEffect, useState } from 'react'
import React from 'react';
import '../Style/Component.css'
import { BarClass } from '../Service/Bar';


export function Group(){
    const [groups, setGroups] = useState([])
    useEffect(() => {
      axios.get('http://localhost:3001/groups/').then((response)=>{
        setGroups(response.data)})
    }, [])

    function searchGroups(groupNumber){
      if(groupNumber.length!==0){
        axios.get(`http://localhost:3001/search/${groupNumber}`).then((response)=>{
            setGroups(response.data["groups"])})
      }
      else{
        axios.get('http://localhost:3001/groups/').then((response)=>{
            setGroups(response.data)})
      }
    }
    return (
      <>
      <div className="container">
        <BarClass />
      </div>
      <div className="container">
        <div className="col">
          <div className="row-sm">
            <input 
                className="form-control mr-sm-2" 
                type="search" 
                placeholder="..." 
                aria-label="Search"
                onChange = {(event) => 
                  {
                    searchGroups(event.target.value)
                  }}
                />
          </div>
          <div className="container overflow-auto">
            <div className="list-group" aria-current="true">
              {
                groups.map((group) => {
                  //return <button type="button" class="list-group-item list-group-item-action">{group.number}</button>
                  return <a key={group.id} href={`\\groups\\${group.id}`} className="btn btn-link btn-lg active" role="button" aria-pressed="true">{group.number}</a>
                })
              }
            </div>
          </div>
        </div>
      </div>
      </>
    );
}


export class Groups extends React.Component {
  render(){
    return (
        <div className="container">
          <Group />
        </div>
    );
  }
}
