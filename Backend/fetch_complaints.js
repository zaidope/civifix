const http = require('http');

http.get('http://localhost:8000/api/complaints/public', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const complaints = JSON.parse(data);
      console.log(`Fetched ${complaints.length} complaints.`);
      complaints.slice(0, 3).forEach(c => {
        console.log(`Complaint ${c._id}:`);
        console.log(`  Location: ${c.location}`);
        console.log(`  Lat/Lng: ${c.latitude}, ${c.longitude}`);
        console.log(`  Category: ${c.category}`);
        console.log(`  Resolved Ward Name: ${c.resolved_ward_name}`);
      });
    } catch (e) {
      console.error(e.message);
    }
  });
}).on('error', (e) => {
  console.error(e.message);
});
