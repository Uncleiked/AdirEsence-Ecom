import { createClient } from "@sanity/client";

const projectId = "75x584bc";
const token = "skpHiWBvW6AcQ1sR4T6eWAOrp4SXF9AHijIqTu7TqeJhB2JybVTVpipI5T7ZHxk4EUtMvY03KLuTa4vibVc9BBP4X1SINGiCazxPbD2bLC8gvk5jqQlOxewAveCsJP2dAcuZUIgRwLX8Dh99uTZzAHiaDOCG7dyZocJO2W9qmvvgGbkaIdOE";

const client = createClient({
  projectId,
  dataset: "production",
  useCdn: false,
  apiVersion: "2024-01-01",
  token,
});

async function run() {
  try {
    console.log("Fetching project members...");
    
    // Attempt 1: hitting /projects/{projectId}/members
    const members = await client.request({
      url: `/projects/${projectId}/members`,
      method: 'GET'
    }).catch(e => { console.log('members failed', e.message); return null; });
    
    if (members) {
      console.log("Success with /members:");
      console.log(JSON.stringify(members, null, 2));
      return;
    }

    // Attempt 2: hitting /users directly 
    const users = await client.request({
      url: `/projects/${projectId}/users`,
      method: 'GET'
    }).catch(e => { console.error("users failed:", e.message); return null; });

    if (users) {
      console.log("Success with /users:");
      console.log(JSON.stringify(users, null, 2));
      return;
    }
  } catch (error) {
    console.error("Failed completely", error);
  }
}

run();
