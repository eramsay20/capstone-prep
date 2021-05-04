import React from 'react';
import { useSelector } from 'react-redux';
import { NavLink } from 'react-router-dom';
import LogoutButton from './auth/LogoutButton';

const NavBar = ({ setAuthenticated }) => {
  const user = useSelector( state => state.session.user )

  const authLinks = (
    <div className='flex-container'>
      <NavLink className='flex-container' to="/" exact={true} activeClassName="active">
        Home
      </NavLink>
      <NavLink className='flex-container' to="/users" exact={true} activeClassName="active">
        Users
      </NavLink>
      <LogoutButton />
    </div>
  )

  const unauthLinks = (
    <div className='flex-container'>
      <NavLink className='flex-container' to="/login" exact={true} activeClassName="active">
        Login
      </NavLink>
      <NavLink className='flex-container' to="/sign-up" exact={true} activeClassName="active">
        Sign Up
      </NavLink>
    </div>
  )

  let linkDisplay;
  user ? linkDisplay = authLinks : linkDisplay = unauthLinks

  return (
    <div>
      {linkDisplay}
    </div>
  );
}

export default NavBar;