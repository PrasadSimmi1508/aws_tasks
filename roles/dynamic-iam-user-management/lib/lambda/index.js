const AWS = require('aws-sdk');
const iam = new AWS.IAM();

exports.handler = async (event) => {
  const { action, userName, password, userRole } = event;
  const groupMap = {
    Developer: process.env.DEVELOPER_GROUP,
    Admin: process.env.ADMIN_GROUP,
    DevOps: process.env.DEVOPS_GROUP,
    Tester: process.env.TESTER_GROUP,
  };

  try {
    if (action === 'create') {
      // Step 1: Create IAM User
      await iam.createUser({ UserName: userName }).promise();

      // Step 2: Set User Password
      await iam
        .createLoginProfile({
          UserName: userName,
          Password: password,
          PasswordResetRequired: false,
        })
        .promise();

      // Step 3: Add User to Group
      if (groupMap[userRole]) {
        await iam
          .addUserToGroup({
            GroupName: groupMap[userRole],
            UserName: userName,
          })
          .promise();
      } else {
        throw new Error(`Invalid user role: ${userRole}`);
      }

      return {
        statusCode: 200,
        body: `User ${userName} created and added to ${userRole} group.`,
      };
    } else if (action === 'addToGroup') {
      // Add existing user to a group
      if (!groupMap[userRole]) throw new Error(`Invalid group: ${userRole}`);
      await iam.addUserToGroup({ GroupName: groupMap[userRole], UserName: userName }).promise();
      return {
        statusCode: 200,
        body: `User ${userName} added to ${userRole} group.`,
      };
    } else if (action === 'delete') {
      // Step 1: Remove User from Groups
      const groups = await iam.listGroupsForUser({ UserName: userName }).promise();
      for (const group of groups.Groups) {
        await iam
          .removeUserFromGroup({
            GroupName: group.GroupName,
            UserName: userName,
          })
          .promise();
      }

      // Step 2: Delete User Login Profile
      try {
        await iam.deleteLoginProfile({ UserName: userName }).promise();
      } catch (err) {
        if (err.code !== 'NoSuchEntity') throw err; // Ignore if login profile does not exist
      }

      // Step 3: Delete Access Keys
      const accessKeys = await iam.listAccessKeys({ UserName: userName }).promise();
      for (const key of accessKeys.AccessKeyMetadata) {
        await iam.deleteAccessKey({ UserName: userName, AccessKeyId: key.AccessKeyId }).promise();
      }

      // Step 4: Delete User
      await iam.deleteUser({ UserName: userName }).promise();

      return {
        statusCode: 200,
        body: `User ${userName} deleted successfully.`,
      };
    } else {
      throw new Error('Invalid action. Valid actions are: create, addToGroup, delete.');
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: `Error: ${error.message}`,
    };
  }
};
