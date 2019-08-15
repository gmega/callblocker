callblocker [![Build Status](https://api.travis-ci.org/gmega/callblocker.svg?branch=master)](https://travis-ci.org/gmega/callblocker) [![License](https://img.shields.io/badge/License-BSD%203--Clause-blue.svg)](https://opensource.org/licenses/BSD-3-Clause) 
===========

Introdução
==========

O problema das chamadas indesejadas é uma questão mundial e no Brasil não é diferente. Um [relatório da First Orion](
https://firstorion.com/nearly-50-of-u-s-mobile-traffic-will-be-scam-calls-by-2019/) estima que, em 2019, quase _metade_
das chamadas telefônicas que recebemos serão chamadas indesejadas (telemarketing ou golpistas). Enquanto celulares nos 
dão instrumentos para ao menos bloquear chamadas de números que já se demonstraram indesejáveis, fazer isso no telefone
fixo é difícil. A maior parte não suporta bloqueio de chamadas e, os que suportam, têm interfaces arcaicas e com dados
que morrem junto com o aparelho. 

Este projeto tenta corrigir isso com um bloqueador de chamadas que oferece uma interface amigável, de modo
a tornar a inspeção e o bloqueio de números no telefone fixo tão simples quanto no celular (veja [screenshots](#screenshots)). 
Para rodar o bloqueador de chamadas, você vai precisar de um pouco de [hardware](#hardware). Mas calma: como este projeto 
foi feito no Brasil, ele usa hardware disponível no mercado brasileiro. Você vai precisar também [instalar](#instalação) e 
[configurar](#configuração) o bloqueador.

Finalmente, se quiser ver alguns screenshots, vá à seção de [screenshots](). 

Hardware
========
Para rodar o bloqueador, você vai precisar de:

* **Um computador de pequeno porte, como um [Raspberry Pi](https://www.raspberrypi.org/).** Eu tinha 
  um [Pi 3 B+](https://www.raspberrypi.org/products/raspberry-pi-3-model-b-plus/) 
  que sobrando aqui em casa, então foi esse que eu usei. O projeto provavelmente roda em versões mais antigas (e baratas) 
  do Raspberry mas eu não tenho como testar. 
  
* **Um Modem USB que suporte identificação de chamadas (caller ID).** Qualquer modem baseado no chipset Conexant CX93010 deve funcionar. 
  Isso inclui boa parte dos modens USB mais baratos disponíveis no [Mercado Livre](https://www.mercadolivre.com.br/)
  e que dizem suportar identificação de chamadas. Infelizmente, os vendedores desse tipo 
  de produto (barato, chinês e sem marca) tipicamente não sabem responder qual o chipset do modem, então o jeito é 
  comprar e ver o que aparece. Adaptar o bloqueador a outros modens é simples mas, de novo, eu não tenho outros modelos 
  para poder testar.
    
* Potencialmente, um conversor de DTMF para FSK, também disponível no Mercado Livre a preços que vão de 30 a 150 reais.
  Eu tenho uma linha fixa tradicional da [Vivo](https://www.vivo.com.br) (i.e., não é aquela linha que brota do Vivo 
  fibra) e, nessas linhas, a Vivo utiliza modulação DTMF para a identificação de chamadas. A 
  [Wikipedia](https://en.wikipedia.org/wiki/Caller_ID) no entanto aponta que outras operadoras podem usar outros 
  padrões (FSK e V23 FSK), então o conversor pode não ser necessário no seu caso.
  
Depois de montado, o hardware do meu bloqueador ficou com essa cara aqui:

<div align="center">
  <img width="729" height="547" src="https://gmega.github.io/callblocker/img/hardware_assembly.jpg">
</div>

  
Instalação
==========

Uma vez montado o hardware e carregado o sistema operacional do Raspberry Pi (eu estou usando o 
[Raspbian Buster](https://www.raspberrypi.org/downloads/raspbian/)), o jeito mais fácil de instalar o bloqueador 
é utilizando o [Docker](https://www.docker.com/). Instalar o Docker no Raspbian é fácil e existem inúmeros artigos na 
Internet descrevendo o procedimento; por exemplo, [este artigo em português](https://www.filipeflop.com/).

Você vai precisar também do [docker-compose](https://docs.docker.com/compose/). A forma mais fácil que conheço de instalá-lo no 
 Raspbian é usando o [pip](https://en.wikipedia.org/wiki/Pip_(package_manager). Para isso, basta executar, num terminal:

```sh
> sudo pip install docker-compose
```

Você então vai ter que compilar a imagem do bloqueador com o Docker:

```sh
> docker build -t callblocker:latest --build-arg BUILD_RPI=1 .
```

se esse comando terminar sem erros, a sua instalação deu certo.

Configuração
============
Para configurar o bloqueador no Raspbian você vai precisar saber:

* **Qual o [arquivo de dispositivo ](https://pt.wikipedia.org/wiki/Arquivo_de_dispositivo) (device file) do seu modem.** Normalmente `/dev/ttyACM0`.
* **Quais os endereços IP, ou qual o record DNS do seu Raspberry na rede.** Isso é usado para configurar a lista de 
  endereços que o backend do bloqueador (baseado no Django) aceita e evitar ataques de 
  [CSRF](https://en.wikipedia.org/wiki/Cross-site_request_forgery). A melhor forma de evitar chatice com isso numa rede 
  local é fixar o endereço do Raspberry no DHCP do seu roteador, ou usar um DNS 
  dinâmico gratuito tipo o [Duck DNS](https://www.duckdns.org/). Aqui em casa usamos o Duck DNS.

Com essa lista na mão, para iniciar o bloqueador basta rodar:
```sh
> HOST_MODEM_DEVICE='/dev/ttyACM0' \
HOST_API_ADDRESSES='192.167.1.163,cblocker.duckdns.org' \
docker-compose up
``` 

onde:
* `HOST_MODEM_DEVICE` é o arquivo de dispositivo do seu modem;
* `HOST_API_ADDRESSES` é a lista de endereços e/ou nomes DNS, separados por vírgula, 
  em que o seu bloqueador deve funcionar. No meu caso, eu acesso o bloqueador de dois endereços:
  * `192.167.1.163`;
  * `cblocker.duckdns.org`. 
  
  então, a minha é `HOST_API_ADDRESSES='192.167.1.163,cblocker.duckdns.org'`.
  
Se tudo der certo, basta abrir um browser no celular ou Desktop e apontá-lo a:
 
 ```http://[endereço]:5000/```
 
 que você deverá ver uma tela como esta:
 
_Voilà!_ O bloqueador de chamadas está funcionando!
 
 Screenshots
 ===========
 
 A interface do bloqueador de chamadas é baseada no [Material UI](https://material-ui.com/). Isso faz com 
 que ela seja familar por um lado (o _material design_ no qual ela é baseada é utilizada nos aplicativos
 do Google) e amigável a dispositivos móveis no outro. O último requisito em particular é fundamental já 
 que eu basicamente acesso o bloqueador de chamadas pelo celular. Alguns screenshots:
 
 Celular
 -------

<div align="center">
    <div>
        <img src="https://gmega.github.io/callblocker/img/recent_callers.png">
        <p>Chamadas recentes.</p>
    </div>
    <div>
        <img src="https://gmega.github.io/callblocker/img/phonebook.png">
        <p>Busca por número e contato na agenda.</p>
    </div>
</div>
  
 
 
