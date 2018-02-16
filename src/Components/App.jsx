import React, { Component } from 'react';
import { Route, Switch, Link } from 'react-router-dom';
import axios from 'axios';

import SignUp from './SignUp';
import Login from './Login';
import Home from './Home';
import Header from './Header';
import Logout from './Logout';

class App extends Component {
  constructor() {
    super();

    this.handleSignUp = this.handleSignUp.bind(this);
    this.handleLogin = this.handleLogin.bind(this);

    this.state = {
    	authenticated: false
    };
  }

  componentDidMount() {
    if(localStorage.getItem('token')) {
      this.setState({ authenticated: true });
    }
  }
  
  async handleLogin(e) {
    const form = e.target;
    let { username, password, email } = form;

    username = username.value;
    password = password.value;

  	e.preventDefault();

  	const { data } = await axios.post('/login', { username, password });

  	if(data.token) {
  		localStorage.setItem('token', data.token);
  	}

  	this.setState({ authenticated: true });
  }

  async handleSignUp(e) {
    const form = e.target;
    let { username, password, email } = form;

    username = username.value;
    password = password.value;
    email = email.value;

    e.preventDefault();

    const { data } = await axios.post('/signup', { username, password, email })

  	if(data.token) {
  		localStorage.setItem('token', data.token);
  	}

  	this.setState({ authenticated: true });
 
  }
  render() {

  	const { authenticated } = this.state;
    const { handleLogin, handleSignUp } = this.props;

    return (
      <div>
        <Header authenticated={authenticated} />
        <Switch>
          <Route exact path="/" render={() => 
          	<Home 
          	  authenticated={authenticated}
          	/>}
          />
          <Route exact path="/login" render={() => 
          	<Login 
          	  authenticated={authenticated}
          	  handler={this.handleLogin}
          	/>}
          />
          <Route exact path="/logout" render={() => <Logout />} />
          <Route exact path="/signup" render={() =>
          	<SignUp 
          	  authenticated={authenticated}
          	  handler={this.handleSignUp}
          	/>}
          />
        </Switch>
      </div>
    );
  }
}

export default App;