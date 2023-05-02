import React from "react";
import { RiPencilLine } from 'react-icons/ri';
import { SiChainlink } from 'react-icons/si';
// reactstrap components
import {
  Button,
  FormGroup,
  Row,
  Input,
  Col,
} from "reactstrap";


function ProfilePage() {
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
          <div style={{ marginRight: 0, marginBottom: 10 }}>
            <SiChainlink />
          </div>
          <h6 style={{ marginLeft: 5, color: "gray" }}>
            0xj435345bh345hvbh45l9
          </h6>
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

export default ProfilePage;