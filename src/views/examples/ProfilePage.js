import React, { Component } from "react";
import { FaLink } from 'react-icons/fa';
import { MdExitToApp } from 'react-icons/md';
import { RiPencilLine } from 'react-icons/ri';
import {
  Button,
  FormGroup,
  Row,
  Input,
  Col,
  Form,
} from "reactstrap";
import NotificationSystem from "react-notification-system";
import PageSpinner from "components/PageSpinner";
import * as Server from "../../utils/Server";
import * as GeneralFunctions from "../../utils/GeneralFunctions";

class ProfilePage extends Component {

  constructor(props) {
    super(props);
    this.state = {
      showLoader: false,
      firstName: "",
      lastName: "",
      phone: "",
      displayUsername: "",
      email: this.props.location.state ? this.props.location.state.email : "",
      password: this.props.location.state ? this.props.location.state.password : "",
      confirmPassword: this.props.location.state ? this.props.location.state.confirmPassword : "",
      signupMethod: this.props.location.state ? this.props.location.state.signupMethod : "",
      walletAddress: this.props.location.state ? this.props.location.state.walletAddress : "",
    };
  }

  signup = async (event) => {
    try {
      event.preventDefault();
      this.setState({ showLoader: true });
      let url; let data;
      if (this.state.signupMethod === 'web3') {
        url = "/web3Auth/signup";
        data = {
          email: this.state.email,
          firstName: this.state.firstName,
          lastName: this.state.lastName,
          phone: this.state.phone,
          userName: this.state.phone,
          displayUsername: this.state.displayUsername,
          walletAddress: this.state.walletAddress
        };
      } else {
        url = "/web2Auth/signup";
        data = {
          email: this.state.email,
          password: this.state.password,
          confirmPassword: this.state.confirmPassword,
          firstName: this.state.firstName,
          lastName: this.state.lastName,
          phone: this.state.phone,
          userName: this.state.phone,
          displayUsername: this.state.displayUsername,
        };
      }
      let response = await Server.request({
        url,
        method: "POST",
        data
      });
      if (response.success) {
        this.setState({ showLoader: false });
        this.props.history.push({
          pathname: '/profile-detail-page',
          state: {
            email: this.state.email,
            password: this.state.password,
            confirmPassword: this.state.confirmPassword,
            firstName: this.state.firstName,
            lastName: this.state.lastName,
            phone: this.state.phone,
            userName: this.state.phone,
            displayUsername: this.state.displayUsername,
            signupMethod: this.state.signupMethod,
            walletAddress: this.state.walletAddress
          }
        });
      }
    } catch (error) {
      this.notificationSystem.addNotification({
        message: error.message,
        level: "error",
      });
      this.setState({ showLoader: false });
    }
  };

  render() {
    return (
      <>
        <PageSpinner showLoader={this.state.showLoader} />
        <Row>
          <Col
            md="6"
            sm="4"
            style={{ marginTop: 40, marginLeft: 10, marginRight: 0 }}
          >
            <h6>Welcome! Set up your profile:</h6>
            <Row
              style={{
                marginLeft: 0,
                marginRight: 0,
                justifyContent: "space-between",
              }}
            >
              <Row
                style={{
                  marginLeft: 0,
                  marginRight: 0,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 40,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "#2CA8FF",
                  }}
                >
                  <div
                    className="alert-icon"
                    style={{ marginLeft: 0, marginRight: 0 }}
                  >
                    <i
                      className="now-ui-icons users_single-02"
                      style={{ color: "white", fontSize: "24px" }}
                    ></i>
                  </div>
                </div>
                <h6 style={{ color: "gray", marginLeft: 5 }}>Add Avatar</h6>
                <div style={{ marginLeft: 5, marginRight: 0, marginBottom: 10 }}>
                  <RiPencilLine />
                </div>
              </Row>
              <Button className="btn-round" color="info" type="button" size="sm">
                Save
              </Button>
            </Row>
          </Col>
          <Col
            sm={6}
            style={{
              marginTop: 20,
              marginLeft: 10,
              backgroundColor: "#e0e0e0",
              borderTopLeftRadius: 30,
              borderTopRightRadius: 30,
              height: "100vh",
            }}
          >
            {this.state.signupMethod === 'web3'
              && <>
                <h6 style={{ marginTop: 20 }}>Connected Web3 Wallet</h6>
                <Row
                  style={{
                    marginLeft: 0,
                    marginRight: 0,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <div style={{
                    marginRight: 0,
                    marginBottom: 10,
                    border: '1px solid #275996',
                    borderRadius: ' 15px',
                    padding: '6px',
                    background: '#275996',
                    display: 'flex',
                    justifyContent: ' center',
                    alignItems: ' center',
                  }}>
                    <FaLink color="white" />
                  </div>
                  <h6 style={{ marginLeft: 5, color: "gray" }}>
                    {this.state.walletAddress ?
                      GeneralFunctions._getFormatAddress(this.state.walletAddress)
                      : '0x0000...0000'}
                  </h6>
                  <MdExitToApp
                    size="20"
                    style={{ cursor: 'pointer', marginBottom: '7px', marginLeft: '7px' }}
                    onClick={() => (GeneralFunctions.clearFullLocalStorage(), this.props.history.push("/login-page"))}
                  />
                </Row>
              </>
            }
            <Form
              onSubmit={(event) => this.signup(event)}
            >
              <Row
                style={{
                  justifyContent: "center",
                  marginLeft: 0,
                  marginRight: 10,
                }}
              >
                <FormGroup style={{ width: "100%", marginTop: 15 }}>
                  <h6>First Name(individual or business)</h6>
                  <Input
                    style={{
                      marginBottom: 10,
                      width: "100%",
                      backgroundColor: "white",
                    }}
                    placeholder="Enter first name"
                    type="text"
                    required
                    value={this.state.firstName}
                    onChange={(event) => this.setState({ firstName: event.target.value })}
                  ></Input>
                  <h6>Last Name(individual or business)</h6>
                  <Input
                    style={{
                      marginBottom: 10,
                      width: "100%",
                      backgroundColor: "white",
                    }}
                    placeholder="Enter last name"
                    type="text"
                    required
                    value={this.state.lastName}
                    onChange={(event) => this.setState({ lastName: event.target.value })}
                  ></Input>
                  <h6>Telephone number</h6>
                  <Input
                    style={{
                      marginBottom: 10,
                      width: "100%",
                      backgroundColor: "white",
                    }}
                    placeholder="Enter telephone number"
                    type="number"
                    required
                    value={this.state.phone}
                    onChange={(event) => this.setState({ phone: event.target.value })}
                  ></Input>
                  <h6>User name</h6>
                  <Input
                    style={{
                      marginBottom: 10,
                      width: "100%",
                      backgroundColor: "white",
                    }}
                    placeholder="Enter username"
                    type="text"
                    required
                    value={this.state.displayUsername}
                    onChange={(event) => this.setState({ displayUsername: event.target.value })}
                  ></Input>
                  <h6>Email</h6>
                  <Input
                    style={{
                      marginBottom: 30,
                      width: "100%",
                      backgroundColor: "white",
                    }}
                    placeholder="Enter email"
                    type="email"
                    required
                    value={this.state.email}
                    onChange={(event) => this.setState({ email: event.target.value })}
                  ></Input>
                </FormGroup>
              </Row>
              <Row style={{ justifyContent: "center", alignItems: "center" }}>
                <Button
                  className="btn-round" color="info" type="submit" size="lg">
                  Done
                </Button>
              </Row>
            </Form>
          </Col>
        </Row >
        <NotificationSystem
          dismissible={false}
          ref={(notificationSystem) =>
            (this.notificationSystem = notificationSystem)
          }
        />
      </>
    );
  }
}

export default ProfilePage;