import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, deleteDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

// Read config
const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const completeServices = [
  // Software / Remap
  { name: 'Remap ECU - Stage 1', description: 'Otimização de software para ganho de potência e torque sem necessidade de peças adicionais. Foco em confiabilidade e dirigibilidade.', price: 1500, estimatedTime: '3 horas', status: 'available' },
  { name: 'Remap ECU - Stage 2', description: 'Ajuste de software mais agressivo. Requer instalação obrigatória de downpipe e filtro esportivo de alto fluxo.', price: 2200, estimatedTime: '4 horas', status: 'available' },
  { name: 'Remap ECU - Stage 3', description: 'Calibração customizada para projetos com upgrade de turbina, bicos injetores e bomba de combustível.', price: 3500, estimatedTime: '2 dias', status: 'on_request' },
  { name: 'Remap TCU (Câmbio)', description: 'Otimização do software do câmbio (DSG, ZF, etc) para trocas mais rápidas, aumento do limite de torque e launch control aprimorado.', price: 1800, estimatedTime: '2 horas', status: 'available' },
  { name: 'Pops & Bangs / VMAX', description: 'Ativação de pipocos no escapamento (Pops & Bangs) e remoção do limitador eletrônico de velocidade (VMAX).', price: 800, estimatedTime: '1 hora', status: 'available' },
  
  // Hardware / Performance
  { name: 'Instalação de Downpipe', description: 'Substituição do catalisador original por downpipe em inox 304 para melhor fluxo de gases, redução de temperatura e ronco mais esportivo.', price: 600, estimatedTime: '3 horas', status: 'available' },
  { name: 'Instalação de Intake', description: 'Instalação de sistema de admissão de ar frio (Cold Air Intake) e filtro esportivo inbox ou cônico.', price: 300, estimatedTime: '1 hora', status: 'available' },
  { name: 'Upgrade de Intercooler', description: 'Instalação de intercooler de maior volume (Wagner Tuning, APR, etc) para reduzir a temperatura do ar de admissão.', price: 800, estimatedTime: '4 horas', status: 'on_request' },
  { name: 'Upgrade de Turbina', description: 'Substituição da turbina original por modelo híbrido ou de maior fluxo (Plug & Play).', price: 1500, estimatedTime: '1 dia', status: 'on_request' },
  { name: 'Instalação de Escapamento Catback', description: 'Instalação de sistema de escapamento completo pós-catalisador em inox.', price: 800, estimatedTime: '4 horas', status: 'on_request' },
  
  // Manutenção Premium
  { name: 'Revisão Premium', description: 'Troca de óleo (Motul/Liqui Moly), filtros originais, verificação completa de freios, suspensão e diagnóstico via scanner VCDS/Odis.', price: 850, estimatedTime: '2 horas', status: 'available' },
  { name: 'Troca de Óleo de Câmbio', description: 'Substituição do fluido de transmissão (DSG, ZF) com equipamento de diálise e filtro original.', price: 1800, estimatedTime: '3 horas', status: 'available' },
  { name: 'Descarbonização (Walnut Blasting)', description: 'Limpeza das válvulas de admissão com casca de noz, serviço essencial para restaurar a potência em motores com injeção direta.', price: 1200, estimatedTime: '1 dia', status: 'on_request' },
  { name: 'Troca de Velas e Bobinas', description: 'Substituição por velas de Iridium grau mais frio e bobinas de alta performance (ex: APR, R8).', price: 400, estimatedTime: '1 hora', status: 'available' },
  
  // Dinamômetro
  { name: 'Aferição em Dinamômetro', description: '3 puxadas no dinamômetro servomotor para medição precisa de potência e torque nas rodas, com entrega de gráfico impresso.', price: 400, estimatedTime: '1 hora', status: 'available' },
];

async function seed() {
  console.log('Iniciando o seed de serviços...');
  const servicesRef = collection(db, 'services');
  
  // Optional: clear existing services first
  // const snapshot = await getDocs(servicesRef);
  // for (const doc of snapshot.docs) {
  //   await deleteDoc(doc.ref);
  // }
  // console.log('Serviços antigos removidos.');

  for (const service of completeServices) {
    await addDoc(servicesRef, {
      ...service,
      createdAt: new Date().toISOString()
    });
    console.log(`Adicionado: ${service.name}`);
  }
  
  console.log('Seed concluído com sucesso!');
  process.exit(0);
}

seed().catch(console.error);
