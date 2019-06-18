from django.db import models


class Source(models.Model):
    name = models.CharField(max_length=50)
    description = models.CharField(max_length=100)

    CID = 1
    USER = 2

    @staticmethod
    def predef_source(pk: int):
        return Source.objects.get(pk=pk)


class PhoneNumber(models.Model):
    class Meta:
        unique_together = (('area_code', 'number'),)

    source = models.ForeignKey(Source, on_delete=models.PROTECT)
    area_code = models.CharField(max_length=2)
    number = models.CharField(max_length=9)
    block = models.BooleanField()


class CallEvent(models.Model):
    number = models.ForeignKey(PhoneNumber, on_delete=models.CASCADE)
    time = models.DateTimeField()
    blocked = models.BooleanField()
