const google = require('googlethis');

async function search() {
  const options = {
    page: 0, 
    safe: false, 
    additional_params: { 
      hl: 'es' 
    }
  };
  
  const response = await google.image('Toma Aerea 15A Leviton', options);
  console.log(response.slice(0, 3));
}

search();
