import BannerHeroi from './sections/BannerHeroi/BannerHeroi'
import NavBar from '../../components/NavBar/NavBar'
import Sobre from './sections/Sobre/Sobre'
import Instituicoes from './sections/Instituicoes/Instituicoes'
import ProvaSocial from './sections/ProvaSocial/ProvaSocial'
import CTAFinal from './sections/CTAFinal/CTAFinal'
import Rodape from '../../components/Rodape/Rodape'

export default function Home() {
    return (
        <>
        
            <NavBar />
            <BannerHeroi />
            <Sobre />
            <Instituicoes />
            <ProvaSocial />
            <CTAFinal />
            <Rodape />
        </>
    )
}