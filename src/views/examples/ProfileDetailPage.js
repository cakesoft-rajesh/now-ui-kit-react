import React, { Component } from "react";
import { FaLink } from 'react-icons/fa';
import { MdExitToApp } from 'react-icons/md';
import {
  Button,
  FormGroup,
  Row,
  Input,
  Col,
} from "reactstrap";
import * as GeneralFunctions from "../../utils/GeneralFunctions";

class ProfileDetailPage extends Component {

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
                width: "100%"
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
            </Row>
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
            height: "auto",
          }}
        >
          <Row style={{ justifyContent: "center", alignItems: "center" }}>
            <Button
              style={{
                pointerEvents: 'none',
                fontWeight: 'bold',
                fontSize: '15px',
                padding: '5px 15px',
              }}
              className="btn-round"
              color="info"
              size="lg"
            >
              Digital I.D.
            </Button>
          </Row>
          <Row style={{ justifyContent: "center", alignItems: "center" }}>
            <h6 style={{ marginTop: 15 }}>yourname.blockchain.io</h6>
          </Row>
          <Row
            style={{
              marginLeft: 0,
              marginRight: 0,
              display: "flex",
              justifyContent: 'center',
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
              marginLeft: 0,
              marginRight: 0,
              color: "gray"
            }}
          >
            <Col xs={12}
              style={{
                display: "flex",
                justifyContent: 'center',
                alignItems: "center",
              }}
            >
              <div style={{ fontWeight: 'bold', marginRight: 0, marginBottom: 10 }}>
                Payment Id :
              </div>
              <h6 style={{ marginLeft: 5 }}>
                Pending
              </h6>
            </Col>
            <Col xs={12}
              style={{
                display: "flex",
                justifyContent: 'center',
                alignItems: "center",
              }}
            >
              <div style={{ fontWeight: 'bold', marginRight: 0, marginBottom: 10 }}>
                Membership :
              </div>
              <h6 style={{ marginLeft: 5 }}>
                Pending
              </h6>
            </Col>
          </Row>
          <Row
            style={{
              justifyContent: "center",
              marginLeft: 0,
              marginRight: 10,
            }}
          >
            <FormGroup style={{ width: "100%", marginTop: 15 }}>
              <h6>Name</h6>
              <Input
                disabled
                style={{
                  marginBottom: 10,
                  width: "100%",
                  backgroundColor: "white",
                }}
                type="text"
              ></Input>
              <h6>Telephone number</h6>
              <Input
                disabled
                style={{
                  marginBottom: 10,
                  width: "100%",
                  backgroundColor: "white",
                }}
                type="number"
              ></Input>
              <h6>User name</h6>
              <Input
                disabled
                style={{
                  marginBottom: 10,
                  width: "100%",
                  backgroundColor: "white",
                }}
                type="text"
              ></Input>
              <h6>Email</h6>
              <Input
                disabled
                style={{
                  marginBottom: 30,
                  width: "100%",
                  backgroundColor: "white",
                }}
                type="text"
              ></Input>
            </FormGroup>
          </Row>
          <Row style={{ justifyContent: "center", alignItems: "center" }}>
            <Button
              style={{
                padding: '15px 30px',
                fontSize: '15px',
                fontWeight: 'bold',
              }}
              className="btn-round" color="info" type="button" size="lg" outline>
              My Credentials
            </Button>
          </Row>
          <Row style={{ justifyContent: "center", alignItems: "center" }}>
            <Button
              style={{
                padding: '15px 70px',
                fontSize: '15px',
                fontWeight: 'bold',
              }}
              className="btn-round" color="info" type="button" size="lg">
              Done
            </Button>
          </Row>
        </Col>
      </Row>
    );
  }
}

export default ProfileDetailPage;