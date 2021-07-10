#include<stdio.h> //printf
#include<string.h> //memset
#include<stdlib.h> //exit(0);
#include<arpa/inet.h>
#include<sys/socket.h>

#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <stdint.h>
#include <amqp_tcp_socket.h>
#include <amqp.h>
#include <amqp_framing.h>

#define BUFLEN 8192  //Max length of buffer
#define PORT 9999   //The port on which to listen for incoming data

void died(char *s) {
    perror(s);
    exit(1);
}

int main(int argc, char const *const *argv) {
    struct sockaddr_in si_me, si_other;

    int s, i, slen = sizeof(si_other) , recv_len;
    char buf[BUFLEN];

    if ((s=socket(AF_INET, SOCK_DGRAM, IPPROTO_UDP)) == -1) {
        died("socket");
    }

    memset((char *) &si_me, 0, sizeof(si_me));

    si_me.sin_family = AF_INET;
    si_me.sin_port = htons(PORT);
    si_me.sin_addr.s_addr = htonl(INADDR_ANY);

    //bind socket to port
    if( bind(s , (struct sockaddr*)&si_me, sizeof(si_me) ) == -1) {
        died("bind");
    }

    if (argc < 2) {
      fprintf(stderr, "Usage: udp_producer host port\n");
      return 1;
    }
    char const *hostname;
    int port;

    hostname = argv[1];
    port = atoi(argv[2]);
    // amqp


    // char const *hostname = "localhost"; int port = 5674;
    int status;
    amqp_socket_t *socket = NULL;
    amqp_connection_state_t conn;
    conn = amqp_new_connection();
    socket = amqp_tcp_socket_new(conn);
    if (!socket) {
      died("creating TCP socket");
    }
    status = amqp_socket_open(socket, hostname, port);
    if (status) {
      died("opening TCP socket");
    }

    die_on_amqp_error(amqp_login(conn, "/", 0, 131072, 0, AMQP_SASL_METHOD_PLAIN, "guest", "guest"), "Logging in");
    amqp_channel_open(conn, 1);
    die_on_amqp_error(amqp_get_rpc_reply(conn), "Opening channel");

    while(1) {
        if ((recv_len = recvfrom(s, buf, BUFLEN, 0, (struct sockaddr *) &si_other, &slen)) == -1) {
            died("recvfrom()");
        }

        amqp_bytes_t message_bytes;
        message_bytes.len = sizeof(buf);
        message_bytes.bytes = buf;

        die_on_error(amqp_basic_publish(conn, 1,
          amqp_cstring_bytes("udp"),
          amqp_cstring_bytes("udp"),
          0, 0,NULL, message_bytes),"Publishing");
    }

    close(s);
    return 0;
}
