async function checkModelsFetch() {
  const apiKey = "AIzaSyBdNv8CDABDwrZ7HSvdASTn1ZDyIdgkymo";
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log("Available Models:", JSON.stringify(data.models?.map(m => m.name), null, 2));
  } catch (e) {
    console.error("Fetch failed:", e);
  }
}

checkModelsFetch();
