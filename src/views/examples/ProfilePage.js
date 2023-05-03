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
} from "reactstrap";
import * as GeneralFunctions from "../../utils/GeneralFunctions";

class ProfilePage extends Component {

  constructor(props) {
    super(props);
  }

  render() {
    return (
      <Row>
        <Col
          md="6"
          sm="4"
          style={{ marginTop: 40, marginLeft: 10, marginRight: 0 }}
        >
          <h6>Profile Settings</h6>
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
              {localStorage.getItem('walletAddress') ?
                GeneralFunctions._getFormatAddress(localStorage.getItem('walletAddress'))
                : '0x0000...0000'}
            </h6>
            <MdExitToApp
              size="20"
              style={{ cursor: 'pointer', marginBottom: '7px', marginLeft: '7px' }}
              onClick={() => (GeneralFunctions.clearFullLocalStorage(), this.props.history.push("/login-page"))}
            />
          </Row>
          <Row
            style={{
              justifyContent: "center",
              marginLeft: 0,
              marginRight: 10,
            }}
          >
            <FormGroup style={{ width: "100%", marginTop: 15 }}>
              <h6>Name(individual or business)</h6>
              <Input
                style={{
                  marginBottom: 10,
                  width: "100%",
                  backgroundColor: "white",
                }}
                defaultValue=""
                placeholder="Enter Name"
                type="text"
              ></Input>
              <h6>Telephone number</h6>
              <Input
                style={{
                  marginBottom: 10,
                  width: "100%",
                  backgroundColor: "white",
                }}
                defaultValue=""
                placeholder="Enter Telephone number"
                type="number"
              ></Input>
              <h6>User name</h6>
              <Input
                style={{
                  marginBottom: 10,
                  width: "100%",
                  backgroundColor: "white",
                }}
                defaultValue=""
                placeholder="Enter username"
                type="text"
              ></Input>
              <h6>Email</h6>
              <Input
                style={{
                  marginBottom: 30,
                  width: "100%",
                  backgroundColor: "white",
                }}
                defaultValue=""
                placeholder="Enter email"
                type="email"
              ></Input>
            </FormGroup>
          </Row>
          <Row style={{ justifyContent: "center", alignItems: "center" }}>
            <Button className="btn-round" color="info" type="button" size="lg">
              Done
            </Button>
          </Row>
        </Col>
      </Row>
    );
  }
}

export default ProfilePage;