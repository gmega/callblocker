from django.db import models


class Source(models.Model):
    name = models.CharField(max_length=50)
    description = models.CharField(max_length=100)

    CID = 1
    USER = 2

    @staticmethod
    def predef_source(pk: int):
        return Source.objects.get(pk=pk)


class Caller(models.Model):
    class Meta:
        unique_together = (('area_code', 'number'),)

    area_code = models.CharField(max_length=2)
    number = models.CharField(max_length=9)
    date_inserted = models.DateTimeField(auto_now_add=True)

    block = models.BooleanField(default=False)

    source = models.ForeignKey(Source, on_delete=models.PROTECT)
    description = models.CharField(max_length=200, default='')
    notes = models.TextField(default='')

    def __str__(self):
        return '(%s) %s' % (self.area_code, self.number)


class Call(models.Model):
    caller = models.ForeignKey(Caller, on_delete=models.CASCADE)
    time = models.DateTimeField()
    blocked = models.BooleanField()
