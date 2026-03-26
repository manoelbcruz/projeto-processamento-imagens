# Processamento Digital de Imagens (PDI) - Laboratório Virtual

Este repositório contém uma suíte completa de algoritmos clássicos de Processamento Digital de Imagens (PDI) implementados do zero utilizando **JavaScript puro** e a **HTML5 Canvas API**, encapsulados em uma interface moderna com **React**.

O projeto foi desenvolvido com foco estrito na fundamentação matemática, evitando o uso de bibliotecas de alto nível para manipulação de pixels (como OpenCV). Todas as matrizes, convoluções e mapeamentos são processados manualmente no lado do cliente.

## 🚀 Funcionalidades e Implementações Teóricas

O sistema é dividido em 6 grandes módulos, correspondendo às clássicas abordagens do domínio espacial e operações morfológicas:

### 1. Composição de Imagens (Aritmética e Lógica)
* **Operações Aritméticas:** Adição, Subtração, Multiplicação e Divisão pixel a pixel. Inclui algoritmo de **Normalização Min-Max** espacial para evitar *overflow/underflow* (clipping) em resoluções de 8-bits.
* **Operações Lógicas (Bit a Bit):** AND, OR e XOR, ideais para extração de Regiões de Interesse (ROI) e aplicação de máscaras binárias.

### 2. Filtros Espaciais (Convolução)
* Motor genérico de convolução `O(W * H * K^2)` com tratamento de fronteira (Zero-Padding/Replication).
* **Filtros Passa-Baixa (Suavização):** Média (matriz de preservação de energia $1/9$) e Mediana (filtro não-linear com *Insertion Sort* para remoção de ruído Sal e Pimenta).
* **Filtros Passa-Alta e Realce:** Laplace (2ª derivada) e High-Boost (Unsharp Masking com fator escalar).
* **Detecção de Bordas (Derivadas Discretas):** Operadores de Roberts, Prewitt, Sobel e Gradiente. Suporte para extração isolada em eixos direcionais (X, Y) e Magnitude Cruzada absoluta.

### 3. Transformações Geométricas (Mapeamento Inverso)
* Implementação baseada em **Inverse Mapping** e interpolação do **Vizinho Mais Próximo (Nearest Neighbor)** para evitar a geração de "buracos" (pixels vazios) característicos do mapeamento direto.
* **Operações:** Translação, Reflexão (Espelhamento), Escala (com redimensionamento dinâmico da matriz), Cisalhamento e Rotação.
* A Rotação inclui translação vetorial automática para o centro fracionário da imagem, garantindo um giro em torno do próprio eixo perfeito para matrizes pares e ímpares.

### 4. Morfologia Matemática
* Suporte dual para imagens binárias (PBM - onde 1 representa a cor de interesse) e níveis de cinza (PGM).
* **Operações:** Erosão, Dilatação, Abertura, Fechamento, Top-Hat, Bottom-Hat e Gradiente Morfológico.
* **Elemento Estruturante (Kernel):** Totalmente customizável pelo usuário (matriz 3x3 dinâmica inserida via interface).

### 5. Histograma e Equalização
* Cálculo dinâmico da Função de Densidade de Probabilidade (PDF) e da Função de Distribuição Acumulada (CDF).
* Equalização global de contraste para otimização da distribuição de intensidades da imagem, acompanhada da plotagem gráfica em tempo real via Canvas.

### 6. Morfismo Temporal (Feature Especial)
* Implementação do algoritmo geométrico de **Anton & Rorres** para *Morphing* entre duas faces.
* Utiliza a biblioteca `delaunator` para gerar a malha de Delaunay a partir dos pontos de controle clicados pelo usuário.
* Transição de forma (Warping com coordenadas baricêntricas) alinhada à transição de cor (Cross-Dissolve).

## 🛠️ Arquitetura e Engenharia de Software

* **React & Tailwind CSS:** Interface de usuário componentizada, reativa e de fácil uso.
* **Separação de Preocupações (SoC):** As lógicas matemáticas estão estritamente isoladas na pasta `src/core/` (arquivos puros de JavaScript), enquanto a pasta `src/pages/` lida apenas com a renderização da interface e gestão de estado.
* **Paralelismo com Web Workers:** A renderização pesada dos quadros do Morfismo e a codificação binária para o formato GIF utilizam o `gif.worker.js`. Isso delega a quantização de cores e a compressão LZW para uma *Thread* em segundo plano, garantindo que a *Main Thread* da UI nunca congele durante cálculos massivos.

## ⚙️ Como Executar o Projeto

Certifique-se de ter o [Node.js](https://nodejs.org/) instalado em sua máquina.

1. Clone o repositório:
   ```bash
   git clone https://github.com/manoelbcruz/projeto-processamento-imagens.git
Acesse a pasta do projeto:

```bash
cd seu-repositorio

```

Instale as dependências:
```bash
npm install
```

Inicie o servidor de desenvolvimento:
```bash
npm run dev
# ou npm start, dependendo do seu empacotador
```

Abra o navegador no endereço indicado (geralmente http://localhost:5173 ou http://localhost:3000).