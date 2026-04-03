// Quick test to verify translation parsing
const testTranslation = () => {
  const translationsString = '{"en":"Collections","pt":"Coleções","fr":"Collections","ar":"المجموعات"}';
  const translations = JSON.parse(translationsString);
  
  console.log('Test translations:', {
    en: translations['en'],
    pt: translations['pt'],
    fr: translations['fr'],
    ar: translations['ar']
  });
};

testTranslation();
