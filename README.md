callblocker [![Build Status](https://api.travis-ci.org/gmega/callblocker.svg?branch=master)](https://travis-ci.org/gmega/callblocker) [![License](https://img.shields.io/badge/License-BSD%203--Clause-blue.svg)](https://opensource.org/licenses/BSD-3-Clause) 
===========
Um bloqueador de chamadas moderno e amigável para telefones fixos.

Introdução
==========

O problema das chamadas indesejadas é uma questão mundial e no Brasil isso não é diferente. Um [relatório da First Orion](
https://firstorion.com/nearly-50-of-u-s-mobile-traffic-will-be-scam-calls-by-2019/) estima que, em 2019, quase _metade_
das chamadas telefônicas recebidas nos Estados Unidos serão chamadas indesejadas (de telemarketing ou golpistas). Enquanto os 
 _smartphones_ modernos nos dão instrumentos para ao menos bloquear chamadas de números que já se demonstraram indesejáveis, 
 os telefones fixos ficaram presos no passado: a maior parte dos aparelhos sequer suporta o bloqueio de chamadas e, dentre os 
 que suportam, interfaces arcaicas e dados que morrem junto com o aparelho são a norma. 

Este projeto tenta corrigir esse problema disponibilizando um bloqueador de chamadas moderno para telefones fixos. Por 
"moderno" se entende: _i)_ dotado de uma interface gráfica amigável (veja [screenshots](#screenshots)); _ii)_ passível 
de backup e exportação de dados e; _iii)_ interligado com facilidades como o 
[Google Contacts](https://contacts.google.com) e bases de telefones suspeitos como o 
[Quem Perturba](https://quemperturba.inerciasensorial.com.br/).

Para rodar o bloqueador de chamadas, você vai precisar de um pouco de [hardware](#hardware). Mas calma: como este projeto 
foi feito no Brasil, ele usa hardware disponível no mercado brasileiro. Você vai precisar também [instalar](#instalação) e 
[configurar](#configuração) o bloqueador.

Se quiser entender quais as limitações atuais, vá para [Limitações](#limitações). Finalmente, se quiser só ver alguns 
screenshots, vá para [screenshots](#screenshots). 

Hardware
========
Para rodar o bloqueador, você vai precisar de:

* **Um computador de pequeno porte, como um [Raspberry Pi](https://www.raspberrypi.org/).** Eu tinha 
  um [Pi 3 B+](https://www.raspberrypi.org/products/raspberry-pi-3-model-b-plus/) 
  sobrando aqui em casa, então foi esse que eu usei. O projeto provavelmente roda em versões mais antigas (e baratas) 
  do Raspberry, mas eu não tenho como testar. 
  
* **Um Modem USB que suporte identificação de chamadas (caller ID).** Qualquer modem baseado no chipset Conexant CX93010 deve funcionar. 
  Isso inclui boa parte dos modems USB mais baratos disponíveis no [Mercado Livre](https://www.mercadolivre.com.br/)
  e que dizem suportar identificação de chamadas. Infelizmente, os vendedores desse tipo 
  de produto (barato, chinês e sem marca) tipicamente não sabem responder qual o chipset do modem, então o jeito é 
  comprar e ver o que aparece. Adaptar o bloqueador a outros modems é simples mas, de novo, eu não tenho outros modelos 
  para poder testar.
    
* **Um conversor de DTMF para FSK (talvez).** Também disponível no Mercado Livre a preços que vão de 30 a 150 reais.
  Eu tenho uma linha fixa tradicional da [Vivo](https://www.vivo.com.br) (i.e., não é aquela linha que brota do Vivo 
  fibra) e, nessas linhas, a Vivo utiliza modulação DTMF para a identificação de chamadas. A 
  [Wikipedia](https://en.wikipedia.org/wiki/Caller_ID) no entanto aponta que outras operadoras **no Brasil** 
  podem usar outros padrões (FSK e V23 FSK), então o conversor pode não ser necessário no seu caso.
  
Depois de montado, o hardware do meu bloqueador ficou com essa cara aqui:

<div align="center">
  <img width="729" hspace="10px" src="https://gmega.github.io/callblocker/img/hardware_assembly.jpg">
</div>

  
Instalação
==========

Uma vez montado o hardware e carregado o sistema operacional do Raspberry Pi (eu estou usando o 
[Raspbian Buster](https://www.raspberrypi.org/downloads/raspbian/)), o jeito mais simples de instalar o bloqueador 
é utilizando o [Docker](https://www.docker.com/). Instalar o Docker no Raspbian é fácil e existem inúmeros artigos na 
Internet descrevendo o procedimento; por exemplo, [este artigo em português](https://www.filipeflop.com/blog/containers-docker-com-raspberry-pi/).

Você vai precisar também do [docker-compose](https://docs.docker.com/compose/). A forma mais fácil que conheço de instalá-lo no 
 Raspbian é usando o [pip](https://en.wikipedia.org/wiki/Pip_%28package_manager%29). Para isso, basta executar, num terminal:

```sh
> sudo pip install docker-compose
```

Você então vai ter que compilar a imagem do bloqueador com o Docker. Para tanto, basta baixar a versão mais atual
do bloqueador:

```sh
> wget -O master.tar.gz https://github.com/gmega/callblocker/tarball/master
```

e extraí-la com:

```sh
> tar xzvf master.tar.gz
```

Isso vai criar um novo diretório contendo o código do bloqueador. Você deve então entrar nesse diretório
e rodar o _build_ do Docker:

```sh
> docker build -t callblocker:latest --build-arg RPI_BUILD=1 .
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

Com essa lista na mão, para iniciar o bloqueador basta rodar, a partir da raíz do diretório criado durante a 
[instalação](#Instalação):

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
 
 
 <div align="center">
    <img src="https://raw.githubusercontent.com/gmega/callblocker/gh-pages/img/no_calls.png">
 </div>
 

_Voilà!_ O bloqueador de chamadas está rodando! Mas isso não quer dizer, claro, que ele esteja funcionando. :-) A melhor
forma de se assegurar que o bloqueador está de fato funcionando, por hora, é fazer uma ligação para o próprio número. Se
tudo estiver funcionando, ela deve aparecer no lugar do aviso de que não há chamadas para mostrar.

Note que o Docker vai se encarregar de inicializar o bloqueador novamente toda vez que o Raspberry Pi for reiniciado, 
então você não precisa se preocupar com criar scripts de inicialização (se é que estava preocupado ;-)).

Limitações
==========

As limitações se dividem em duas categorias:

1. **limitações tecnológicas.** Estas são as limitações inerentes à abordagem utilizada e são, portanto, permanentes.
2. **Limitações da implementação.** Estas são limitações da implementação atual e provavelmente serão resolvidas num 
     futuro próximo.
     
Limitações Tecnológicas
-----------------------
O bloqueio é feito com base na informação de identificação de chamadas e nas possibilidades oferecidas
por um modem comum. Isso traz duas limitações:

1. se a pessoa que chama souber como [manipular a informação de identificação de chamada](https://en.wikipedia.org/wiki/Caller_ID_spoofing)
   (o que, infelizmente, não é tão difícil quanto parece), ela pode inventar um número qualquer e furar a sua lista de 
   bloqueio. Pior ainda, ela pode te levar a bloquear números que não são dela. Note que, embora importante, essa limitação é 
   comum à maior parte dos bloqueadores modernos, inclusive os presentes nos smartphones.
   
2. As operadoras tipicamente transmitem a informação de identificação de chamada após o primeiro toque. Isso quer dizer
   que o telefone sempre toca uma vez, mesmo para números bloqueados. Para evitar que isso aconteça, seria necessário suprimir o 
   primeiro toque de todas as chamadas. Isso, infelizmente, não é possível com um modem comum.
   
Limitações de Implementação
-----------------------
Na versão atual, ainda faltam:

1. **Autenticação.** Qualquer usuário ligado à sua rede local tem acesso irrestrito ao bloqueador de chamadas. Isso deve
   mudar em breve numa versão futura.
   
2. **HTTPS.** A comunicação é atualmente feita por HTTP, o que quer dizer que o tráfego é visível a observadores na 
   rede. Isso inclui as eventuais senhas e tokens de autenticação que vão existir quando implementarmos (1). Usar HTTPS
   em redes locais é inerentemente chato por causa da natureza dos certificados SSL. Portanto, mesmo quando isto estiver
   disponível, vai ser chato de configurar/usar.
   
3. **Contatos.** Os contatos estão armazenados num banco de dados local e, atualmente, não existem ferramentas para 
   exportá-los ou integrá-los com uma agenda existente como o [Google Contatos](https://contacts.google.com/) (embora
   seja possível lê-los do banco, um [PostgreSQL](https://www.postgresql.org)). Isso deve mudar numa versão futura.
   
4. **Debugging.** Não existem ferramentas integradas para verificar o funcionamento do modem e do bloqueador de chamadas.
   Isso torna a configuração e resolução de problemas mais difícil. Isso também deve mudar numa versão futura.
   
5. **Busca em bases de dados de telefones.** Existem alguns sites como o 
   [Quem Perturba](https://quemperturba.inerciasensorial.com.br/)
   que permitem que usuários comentem sobre o comportamento de certos números de telefone. Seria simples (e útil) 
   poder mostrar os comentários associados a um determinado telefone desconhecido. Mais legal ainda seria analisar 
   os comentários e decidir se o telefone deve ser bloqueado ou não usando NLP. Pretendo fazer ambas as coisas em 
   numa versão futura.
 
Screenshots
===========
 
A interface do bloqueador de chamadas é baseada no [Material UI](https://material-ui.com/). Isso faz com 
que ela seja familar por um lado (o _material design_ no qual ela é baseada é utilizada nos aplicativos
do Google) e amigável a dispositivos móveis no outro. O último requisito em particular é fundamental já 
que eu basicamente acesso o bloqueador de chamadas pelo smartphone. Alguns screenshots:
 
Celular
-------

 <div align="center">
  
  Chamadas recentes        |  Busca na agenda
:-------------------------:|:-------------------------:
<img width="300" src="https://gmega.github.io/callblocker/img/recent_callers.png"/>    |  <img width="300" src="https://gmega.github.io/callblocker/img/phonebook.png"/>  

</div>

Desktop
-------

 <div align="center">
  
  Chamadas recentes        |  Busca na agenda
:-------------------------:|:-------------------------:
<img width="500" src="https://raw.githubusercontent.com/gmega/callblocker/gh-pages/img/recent_callers_desktop.png">|  <img width="500" src="https://gmega.github.io/callblocker/img/phonebook_desktop.png">  

</div>



