// les extrais audio de teste que j'ai telechargé  
export const defaultAudioAssets = [
  {
    id: 'default_piano',
    name: 'Piano Classique',
    uri: require('./piano.wav'), 
    source: 'asset',
    description: 'Extrait de piano classique (3-5 secondes)',
    duration: 3000 
  },
  {
    id: 'default_guitar',
    name: 'Guitare Rock',
    uri: require('./guitare.wav'), 
    source: 'asset',
    description: 'Riff de guitare électrique (3-5 secondes)',
    duration: 4000
  },


];


export default defaultAudioAssets;