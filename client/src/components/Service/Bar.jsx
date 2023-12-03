import React from 'react';
import '../Style/Component.css'


export function Bar(){
    return (
        <nav className="navbar navbar-expand-lg navbar-light bg-light">
            <ul className="navbar-nav">
                <li className="nav-item-active">
                    <a className="navbar-brand" href="/staff">Преподаватель</a>
                </li>
                <li className="nav-item-active">
                    <a className="navbar-brand" href="/groups">Группа</a>
                </li>
            </ul>
        </nav>
      )
}


export class BarClass extends React.Component {
    render(){
      return (
          <div className="container">
            <Bar />
          </div>
      );
    }
  }