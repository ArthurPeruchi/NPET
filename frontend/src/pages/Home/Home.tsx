import BannerHeroi from './sections/BannerHeroi/BannerHeroi'
import NavBar from '../../components/NavBar/NavBar'
import Sobre from './sections/Sobre/Sobre'
import Instituicoes from './sections/Instituicoes/Instituicoes'
import ProvaSocial from './sections/ProvaSocial/ProvaSocial'
import CTAFinal from './sections/CTAFinal/CTAFinal'
import Rodape from '../../components/Rodape/Rodape'
import DashboardInstituicao from '../DashboardInstituicao/DashBoardInstituicao'
import { useAuth } from '../../auth/useAuth'

export default function Home() {
    const { tipoUsuario } = useAuth();

    if (tipoUsuario === "instituicao") {
        return (
            <DashboardInstituicao />
        )
    }
    
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