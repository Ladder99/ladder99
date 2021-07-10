FROM rabbitmq:management

RUN rabbitmq-plugins enable --offline \
    rabbitmq_federation \
    rabbitmq_federation_management \
    rabbitmq_shovel \
    rabbitmq_shovel_management \
    rabbitmq_mqtt \
    rabbitmq_auth_backend_ldap \
    rabbitmq_management

ADD rabbitmq.config /etc/rabbitmq/rabbitmq.config
ADD enabled_plugins /etc/rabbitmq/enabled_plugins

COPY rabbitmq.config /etc/rabbitmq/rabbitmq.config
EXPOSE 1883 5672 15672 25672
