import google from 'googlethis';

async function test() {
  const options = {
    page: 0, 
    safe: false, 
    additional_params: { 
      hl: 'es' 
    }
  };
  
  const response = await google.image('Toma Aerea 15A Leviton', options);
  console.log(JSON.stringify(response.slice(0, 2), null, 2));
}
test();
